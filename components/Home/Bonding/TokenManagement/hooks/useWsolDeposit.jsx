import { Program } from '@coral-xyz/anchor';
import idl from 'common-util/AbiAndAddresses/liquidityLockbox.json';
import { DecimalUtil, Percentage } from '@orca-so/common-sdk';
import Decimal from 'decimal.js';
import {
  increaseLiquidityQuoteByInputTokenWithParams,
  TickUtil,
} from '@orca-so/whirlpools-sdk';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { notifyError, notifySuccess } from '@autonolas/frontend-library';

import { useSvmConnectivity } from 'common-util/hooks/useSvmConnectivity';
import { SVM_EMPTY_ADDRESS } from '../utils';
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

export const [tickLowerIndex, tickUpperIndex] = TickUtil.getFullRangeTickIndex(TICK_SPACING);

export const useWsolDeposit = () => {
  const { nodeProvider, svmWalletPublicKey } = useSvmConnectivity();
  const { getWhirlpoolData } = useWhirlpool();
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
      return;
    }

    const { whirlpoolTokenA, whirlpoolTokenB } = await getWhirlpoolData();
    const quote = getDepositIncreaseLiquidityQuote({ wsol, slippage });

    const tokenOwnerAccountA = await getAssociatedTokenAddress(
      whirlpoolTokenA.mint,
      svmWalletPublicKey,
    );

    const tokenOwnerAccountB = await getAssociatedTokenAddress(
      whirlpoolTokenB.mint,
      svmWalletPublicKey,
    );

    // TODO check for lamports balance to be bigger than solMax
    const balance = await connection.getBalance(svmWalletPublicKey);
    if (solMax > balance) {
        notification.error("Not enough SOL")
    }

    // TODO check for OLAS amount to be bigger or equal than olasMax
      let tokenAccounts = await provider.connection.getTokenAccountsByOwner(
        svmWalletPublicKey,
        { programId: TOKEN_PROGRAM_ID }
      );

      let olasAmount;
      tokenAccounts.value.forEach((tokenAccount) => {
        const accountData = AccountLayout.decode(tokenAccount.account.data);
        if (accountData.mint.toString() == ADDRESSES.svm.olasAddress.toString() {
          // accountData.amount.toString()
          olasAmount =  accountData.amount.toNumber();
        }
      });

      // TODO check that there is enough OLAS
      if (olasMax > olasAmount) {
        notification.error("Not enough OLAS")
      }

    // Check if the user has the correct token account
    // and it is required to deposit
    if (
      tokenOwnerAccountA === SVM_EMPTY_ADDRESS
      || tokenOwnerAccountB === SVM_EMPTY_ADDRESS
    ) {
      notifyError('You do not have the correct token account');
      return;
    }

    const bridgedTokenAccount = await customGetOrCreateAssociatedTokenAccount(
      BRIDGED_TOKEN_MINT,
      svmWalletPublicKey,
    );

    if (!bridgedTokenAccount) {
      notifyError(
        'You do not have the bridged token account, please try again.',
      );
      return;
    }

    // Transfer SOL to associated token account and use SyncNative to update wrapped SOL balance
    // Wrap the required amount of SOL by transferring SOL to WSOL ATA and syncing native
    const solTransferTransaction = new Transaction()
      .add(
        SystemProgram.transfer({
            fromPubkey: svmWalletPublicKey,
            toPubkey: tokenOwnerAccountA.address,
            lamports: quote.tokenMaxA.toNumber() // TODO check the actual argument type
          }),
          createSyncNativeInstruction(
            tokenOwnerAccountA.address
          )
      )

    try {
        // TODO userWallet - sign transaction
        const signature = await sendAndConfirmTransaction(provider.connection, solTransferTransaction, [userWallet]);
        // TODO probably use configureAndSendCurrentTransaction
    } catch (error) {
        if (error instanceof Error && "message" in error) {
            console.error("Program Error:", error);
            console.error("Error Message:", error.message);
        } else {
            console.error("Transaction Error:", error);
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
  };

  tokenAccounts = await provider.connection.getTokenAccountsByOwner(
    svmWalletPublicKey,
    { programId: TOKEN_PROGRAM_ID }
  );

  let bridgedTokenAmount;
  tokenAccounts.value.forEach((tokenAccount) => {
    const accountData = AccountLayout.decode(tokenAccount.account.data);
    if (accountData.mint.toString() == BRIDGED_TOKEN_MINT.toString() {
      // accountData.amount.toString()
      bridgedTokenAmount = accountData.amount.toNumber();
    }
  });

  return {
    getDepositIncreaseLiquidityQuote,
    getDepositTransformedQuote,
    deposit,
    bridgedTokenAmount
  };
};
