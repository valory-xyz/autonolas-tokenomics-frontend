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
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import {
  // LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  // sendAndConfirmTransaction,
} from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { notifyError, notifySuccess } from '@autonolas/frontend-library';

import { useSvmConnectivity } from 'common-util/hooks/useSvmConnectivity';
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

const getOlasAmount = async (connection, walletPublicKey, tokenAddress) => {
  const tokenAccounts = await connection.getTokenAccountsByOwner(
    walletPublicKey,
    { programId: TOKEN_PROGRAM_ID },
  );

  let tokenAmount = 0n;
  tokenAccounts.value.forEach((tokenAccount) => {
    const accountData = AccountLayout.decode(tokenAccount.account.data);
    if (accountData.mint.toString() === tokenAddress.toString()) {
      tokenAmount = accountData.amount;
    }
  });

  return tokenAmount;
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

    // OLAS associated token account MUST always exist when the person bonds
    const tokenOwnerAccountB = await getAssociatedTokenAddress(
      whirlpoolTokenB.mint,
      svmWalletPublicKey,
    );
    let account = await connection.getAccountInfo(tokenOwnerAccountB);
    if (!account) {
      notifyError('OLAS Associated token account does not exist');
      return null;
    }

    // Check if the user has enough OLAS
    const olasAmount = await getOlasAmount(connection, svmWalletPublicKey, whirlpoolTokenB.mint);
    const noEnoughOlas = DecimalUtil.fromBN(olasMax).greaterThan(
      DecimalUtil.fromBN(olasAmount),
    );
    if (noEnoughOlas) {
      notifyError('Not enough OLAS balance');
      return null;
    }

    // Check if the user has the correct token account
    // and it is required to deposit
    if (tokenOwnerAccountB.toString() === SVM_EMPTY_ADDRESS) {
      notifyError('You do not have the correct token account');
      return null;
    }

    const bridgedTokenAccount = await customGetOrCreateAssociatedTokenAccount(
      BRIDGED_TOKEN_MINT,
      svmWalletPublicKey,
    );

    console.log({ bridgedTokenAccount: bridgedTokenAccount.toString() });

    if (!bridgedTokenAccount) {
      notifyError(
        'You do not have the bridged token account, please try again.',
      );
      return null;
    }

    // Transfer SOL to associated token account and use SyncNative to update wrapped SOL balance
    // Wrap the required amount of SOL by transferring SOL to WSOL ATA and syncing native

    const tokenOwnerAccountA = await getAssociatedTokenAddress(
      whirlpoolTokenA.mint,
      svmWalletPublicKey,
    );

    console.log({
      quote,
      solMax,
      olasMax,
      tokenOwnerAccountA: tokenOwnerAccountA.toString(),
      tokenOwnerAccountB: tokenOwnerAccountB.toString(),
    });

    let needToWrap = false;
    account = await connection.getAccountInfo(tokenOwnerAccountA);
    if (!account) {
      // Create token account to hold wrapped SOL
      const ataTransaction = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          svmWalletPublicKey,
          tokenOwnerAccountA,
          svmWalletPublicKey,
          whirlpoolTokenA.mint,
        ),
      );

      try {
        const signature = await configureAndSendCurrentTransaction(
          ataTransaction,
          connection,
          svmWalletPublicKey,
          signTransaction,
        );
        console.log('Signature:', signature);
      } catch (error) {
        notifyError('Error creating token account for WSOL ATA');
        console.error(error);
        return null;
      }

      needToWrap = true;
    } else {
      // Check if the user has enough WSOL
      const wsolAmount = await getOlasAmount(connection, svmWalletPublicKey, whirlpoolTokenA.mint);
      const noEnoughWsol = DecimalUtil.fromBN(solMax).greaterThan(
        DecimalUtil.fromBN(wsolAmount),
      );
      if (noEnoughWsol) {
        needToWrap = true;
      }
    }

    if (needToWrap) {
      const balance = await connection.getBalance(svmWalletPublicKey);

      // Check if the user has enough SOL balance
      if (solMax > balance) {
        notifyError('Not enough SOL balance');
        return null;
      }

      const solTransferTransaction = [];

      const systemInstruction = SystemProgram.transfer({
        fromPubkey: svmWalletPublicKey,
        toPubkey: tokenOwnerAccountA,
        lamports: quote.tokenMaxA,
      });
      solTransferTransaction.push(systemInstruction);

      const syncNativeInstruction = createSyncNativeInstruction(tokenOwnerAccountA);
      solTransferTransaction.push(syncNativeInstruction);

      const transaction = new Transaction().add(...solTransferTransaction);
      console.log('solTransferTransaction:', {
        systemInstruction,
        syncNativeInstruction,
        transaction,
      });

      try {
        const signature = await configureAndSendCurrentTransaction(
          transaction,
          connection,
          svmWalletPublicKey,
          signTransaction,
        );

        notifySuccess('SOL transfer successful', signature);
        console.log('Signature: (after SOL transfer)', signature);
      } catch (error) {
        notifyError('Error transferring SOL to WSOL ATA');

        if (error instanceof Error && 'message' in error) {
          console.error('Program Error:', error);
          console.error('Error Message:', error.message);
        } else {
          console.error('Transaction Error:', error);
        }

        return null;
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
          bridgedTokenAccount,
          bridgedTokenMint: BRIDGED_TOKEN_MINT,
          lockbox: LOCKBOX,
          whirlpoolProgram: ORCA,
        })
        .rpc();

      notifySuccess('Deposit successful', signature);
    } catch (error) {
      notifyError('Error depositing liquidity');
      console.error(error);
    }

    // await closeAccount(connection, wallet, associatedTokenAccount, wallet.publicKey, wallet);

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
