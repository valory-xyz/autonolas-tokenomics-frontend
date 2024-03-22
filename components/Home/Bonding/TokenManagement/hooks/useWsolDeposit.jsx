import { Program } from '@coral-xyz/anchor';
import idl from 'common-util/AbiAndAddresses/liquidityLockbox.json';
import { DecimalUtil, Percentage } from '@orca-so/common-sdk';
import Decimal from 'decimal.js';
import {
  increaseLiquidityQuoteByInputTokenWithParams,
  TickUtil,
} from '@orca-so/whirlpools-sdk';
import {
  AccountLayout,
  TOKEN_PROGRAM_ID,
  createSyncNativeInstruction,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import {
  // LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { notifyError, notifySuccess } from '@autonolas/frontend-library';

import { useSvmConnectivity } from 'common-util/hooks/useSvmConnectivity';
import { ADDRESSES } from 'common-util/Contracts';
import {
  SVM_EMPTY_ADDRESS,
  configureAndSendCurrentTransaction,
} from '../utils';
import { useGetOrCreateAssociatedTokenAccount } from './useGetOrCreateAssociatedTokenAccount';
import { useWhirlpool } from './useWhirlpool';
import {
  SOL,
  BRIDGED_TOKEN_MINT,
  LOCKBOX,
  ORCA,
  PDA_POSITION_ACCOUNT,
  POSITION,
  POSITION_MINT,
  PROGRAM_ID,
  TICK_ARRAY_LOWER,
  TICK_ARRAY_UPPER,
  TOKEN_VAULT_A,
  TOKEN_VAULT_B,
  WHIRLPOOL,
  TICK_SPACING,
} from '../constants';

const getOlasAmount = async (connection, walletPublicKey) => {
  const tokenAccounts = await connection.getTokenAccountsByOwner(
    walletPublicKey,
    { programId: TOKEN_PROGRAM_ID },
  );

  let olasAmount = 0n; // TODO: check with @kupermind what is olasAmount is null or 0
  tokenAccounts.value.forEach((tokenAccount) => {
    const accountData = AccountLayout.decode(tokenAccount.account.data);
    if (accountData.mint.toString() === ADDRESSES.svm.olasAddress.toString()) {
      olasAmount = accountData.amount;
    }
  });

  return olasAmount;
};

const getBridgeTokenAmount = async (connection, walletPublicKey) => {
  const tokenAccounts = await connection.getTokenAccountsByOwner(
    walletPublicKey,
    { programId: TOKEN_PROGRAM_ID },
  );

  let bridgedTokenAmount = 0n;
  tokenAccounts.value.forEach((tokenAccount) => {
    const accountData = AccountLayout.decode(tokenAccount.account.data);
    if (accountData.mint.toString() === BRIDGED_TOKEN_MINT.toString()) {
      bridgedTokenAmount = accountData.amount;
    }
  });

  return bridgedTokenAmount;
};

export const [tickLowerIndex, tickUpperIndex] = TickUtil.getFullRangeTickIndex(TICK_SPACING);

export const useWsolDeposit = () => {
  const { nodeProvider, svmWalletPublicKey, connection } = useSvmConnectivity();
  const { getWhirlpoolData } = useWhirlpool();
  const { signTransaction } = useWallet();

  const customGetOrCreateAssociatedTokenAccount = useGetOrCreateAssociatedTokenAccount();
  const program = new Program(idl, PROGRAM_ID, nodeProvider);

  const getDepositIncreaseLiquidityQuote = async ({ wsol, slippage }) => {
    const { whirlpoolData, whirlpoolTokenA, whirlpoolTokenB } = await getWhirlpoolData();
    const slippageTolerance = Percentage.fromDecimal(new Decimal(slippage));
    const inputTokenAmount = DecimalUtil.toBN(new Decimal(wsol), 9);

    return increaseLiquidityQuoteByInputTokenWithParams({
      tokenMintA: whirlpoolTokenA.mint,
      tokenMintB: whirlpoolTokenB.mint,
      sqrtPrice: whirlpoolData.sqrtPrice,
      tickCurrentIndex: whirlpoolData.tickCurrentIndex,
      tickLowerIndex,
      tickUpperIndex,
      inputTokenMint: SOL,
      inputTokenAmount,
      slippageTolerance,
    });
  };

  const getDepositTransformedQuote = async (quote) => {
    const { whirlpoolTokenA, whirlpoolTokenB } = await getWhirlpoolData();

    const solMax = DecimalUtil.fromBN(
      quote.tokenMaxA,
      whirlpoolTokenA.decimals,
    ).toFixed(whirlpoolTokenA.decimals);

    const olasMax = DecimalUtil.fromBN(
      quote.tokenMaxB,
      whirlpoolTokenB.decimals,
    ).toFixed(whirlpoolTokenB.decimals);

    const liquidity = quote.liquidityAmount.toString();
    return { solMax, olasMax, liquidity };
  };

  const deposit = async ({ wsol, slippage }) => {
    if (!svmWalletPublicKey) {
      notifyError('Please connect your phantom wallet');
      return null;
    }

    const { whirlpoolTokenA, whirlpoolTokenB } = await getWhirlpoolData();
    const quote = await getDepositIncreaseLiquidityQuote({ wsol, slippage });
    const { solMax, olasMax } = await getDepositTransformedQuote(quote);

    const tokenOwnerAccountA = await getAssociatedTokenAddress(
      whirlpoolTokenA.mint,
      svmWalletPublicKey,
    );

    const tokenOwnerAccountB = await getAssociatedTokenAddress(
      whirlpoolTokenB.mint,
      svmWalletPublicKey,
    );

    const balance = await connection.getBalance(svmWalletPublicKey);
    // const balanceInSol = (balance / LAMPORTS_PER_SOL); // TODO: check with @kupermind

    // Check if the user has enough SOL balance
    if (solMax > balance) {
      notifyError('Not enough SOL balance');
      return null;
    }

    // Check if the user has enough OLAS
    const olasAmount = await getOlasAmount(connection, svmWalletPublicKey);
    const noEnoughOlas = DecimalUtil.fromBN(olasMax).greaterThan(
      DecimalUtil.fromBN(olasAmount),
    );
    if (noEnoughOlas) {
      notifyError('Not enough OLAS balance');
      return null;
    }

    // Check if the user has the correct token account
    // and it is required to deposit
    if (
      tokenOwnerAccountA === SVM_EMPTY_ADDRESS
      || tokenOwnerAccountB === SVM_EMPTY_ADDRESS
    ) {
      notifyError('You do not have the correct token account');
      return null;
    }

    const bridgedTokenAccount = await customGetOrCreateAssociatedTokenAccount(
      BRIDGED_TOKEN_MINT,
      svmWalletPublicKey,
    );

    if (!bridgedTokenAccount) {
      notifyError(
        'You do not have the bridged token account, please try again.',
      );
      return null;
    }

    // Transfer SOL to associated token account and use SyncNative to update wrapped SOL balance
    // Wrap the required amount of SOL by transferring SOL to WSOL ATA and syncing native
    const solTransferTransaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: svmWalletPublicKey,
        toPubkey: tokenOwnerAccountA.address,
        lamports: quote.tokenMaxA,
      }),
      createSyncNativeInstruction(tokenOwnerAccountA.address),
    );

    try {
      const signature = await configureAndSendCurrentTransaction(
        solTransferTransaction,
        connection,
        svmWalletPublicKey,
        signTransaction,
      );
      notifySuccess('SOL transfer successful', signature);
    } catch (error) {
      notifyError('Error transferring SOL to WSOL ATA');

      if (error instanceof Error && 'message' in error) {
        console.error('Program Error:', error);
        console.error('Error Message:', error.message);
      } else {
        console.error('Transaction Error:', error);
      }
    }

    try {
      const signature = await program.methods
        .deposit(quote.liquidityAmount, quote.tokenMaxA, quote.tokenMaxB)
        .accounts({
          position: POSITION,
          poistionMint: POSITION_MINT,
          pdaPositionAccount: PDA_POSITION_ACCOUNT,
          whirlpool: WHIRLPOOL,
          tokenOwnerAccountA,
          tokenOwnerAccountB,
          tokenVaultA: TOKEN_VAULT_A,
          tokenVaultB: TOKEN_VAULT_B,
          tickArrayLower: TICK_ARRAY_LOWER,
          tickArrayUpper: TICK_ARRAY_UPPER,
          bridgedTokenAccount: bridgedTokenAccount.address,
          bridgedTokenMint: BRIDGED_TOKEN_MINT,
          lockbox: LOCKBOX,
          whirlpoolProgram: ORCA,
        })
        .rpc();

      notifySuccess('Deposit successful', signature);
    } catch (error) {
      console.error(error);
    }

    const bridgedToken = await getBridgeTokenAmount(
      connection,
      svmWalletPublicKey,
    );
    return bridgedToken.toString();
  };

  return {
    getDepositIncreaseLiquidityQuote,
    getDepositTransformedQuote,
    deposit,
  };
};
