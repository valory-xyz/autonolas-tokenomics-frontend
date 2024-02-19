import { Program } from '@coral-xyz/anchor';
import idl from 'common-util/AbiAndAddresses/liquidityLockbox.json';
import { DecimalUtil, Percentage } from '@orca-so/common-sdk';
import Decimal from 'decimal.js';
import {
  increaseLiquidityQuoteByInputTokenWithParams,
  TickUtil,
} from '@orca-so/whirlpools-sdk';
import { getAssociatedTokenAddress } from '@solana/spl-token';
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
  PROGRAM_ID,
  TICK_ARRAY_LOWER,
  TICK_ARRAY_UPPER,
  TOKEN_VAULT_A,
  TOKEN_VAULT_B,
  WHIRLPOOL,
  TICK_SPACING,
} from './constants';

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

    const quote = increaseLiquidityQuoteByInputTokenWithParams({
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

    return quote;
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

    // console.log('Token Owner Account A:', tokenOwnerAccountA.toString());
    // console.log('Token Owner Account B:', tokenOwnerAccountB.toString());

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
    // console.log(
    //   'User ATA for bridged:',
    //   bridgedTokenAccount.address.toBase58(),
    // );

    if (!bridgedTokenAccount) {
      notifyError('You do not have the bridged token account, please try again.');
      return;
    }

    try {
      const signature = await program.methods
        .deposit(quote.liquidityAmount, quote.tokenMaxA, quote.tokenMaxB)
        .accounts({
          position: POSITION,
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
        // .signers([userWallet])
        .rpc();

      notifySuccess('Deposit successful', signature);
      // console.log('Deposit Signature:', signature);
    } catch (error) {
      console.error(error);
    }
  };

  return { getDepositIncreaseLiquidityQuote, getDepositTransformedQuote, deposit };
};
