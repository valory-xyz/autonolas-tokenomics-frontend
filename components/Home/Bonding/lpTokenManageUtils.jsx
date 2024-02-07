/* eslint-disable camelcase */
import {
  // AnchorProvider,
  setProvider,
  web3,
  // getProvider,
} from '@coral-xyz/anchor';
// import { Program } from '@coral-xyz/anchor';
// import idl_whirlpool from 'common-util/AbiAndAddresses/whirlpool.json';
import { AnchorProvider } from '@project-serum/anchor';
import NodeWallet from '@project-serum/anchor/dist/cjs/nodewallet';

import { DecimalUtil, Percentage } from '@orca-so/common-sdk';
import Decimal from 'decimal.js';
import {
  WhirlpoolContext,
  buildWhirlpoolClient,
  // ORCA_WHIRLPOOL_PROGRAM_ID,
  // PDAUtil,
  // PoolUtil,
  // PriceMath,
  increaseLiquidityQuoteByInputTokenWithParams,
  // decreaseLiquidityQuoteByLiquidityWithParams,
  TickUtil,
} from '@orca-so/whirlpools-sdk';
import { useConnection } from '@solana/wallet-adapter-react';
import { Keypair } from '@solana/web3.js';
import { queries } from '@testing-library/react';
import { BigNumber } from 'ethers';

const orca = new web3.PublicKey('whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc');

const whirlpool = new web3.PublicKey(
  '5dMKUYJDsjZkAD3wiV3ViQkuq9pSmWQ5eAzcQLtDnUT3',
);
const sol = new web3.PublicKey('So11111111111111111111111111111111111111112');
const wallet = new NodeWallet(Keypair.generate());

// const olas_amount = DecimalUtil.toBN(new Decimal('10' /* olas */), 8);
const sol_amount = DecimalUtil.toBN(new Decimal('10' /* olas */), 9);

const tickSpacing = 64;
const [lower_tick_index, upper_tick_index] = TickUtil.getFullRangeTickIndex(tickSpacing);

// const slippage = Percentage.fromFraction(10, 1000); // 1%

const countDecimals = (value) => {
  if (value % 1 !== 0) return value.toString().split('.')[1].length;
  return 0;
};

export const useDepositEstimation = () => {
  const { connection } = useConnection();

  const increaseLiquidityQuote = async ({ wsol, slippage }) => {
    console.log('wsol', { wsol, slippage });

    const provider = new AnchorProvider(connection, wallet);
    setProvider(provider);

    const ctx = WhirlpoolContext.withProvider(provider, orca);
    const client = buildWhirlpoolClient(ctx);
    const whirlpoolClient = await client.getPool(whirlpool);

    const whirlpool_data = whirlpoolClient.getData();
    const token_a = whirlpoolClient.getTokenAInfo();
    const token_b = whirlpoolClient.getTokenBInfo();

    const slippageDecimalCount = countDecimals(slippage);
    console.log('slippageDecimalCount', slippageDecimalCount);

    // const slippageTolerance = Percentage.fromFraction(
    //   slippage * 10 ** slippageDecimalCount,
    //   100 * 10 ** slippageDecimalCount,
    // );

    const slippageTolerance = Percentage.fromDecimal(new Decimal(slippage));

    console.log('slippageTolerance', slippageTolerance.toString());

    const quote = increaseLiquidityQuoteByInputTokenWithParams({
      // Pass the pool definition and state
      tokenMintA: token_a.mint,
      tokenMintB: token_b.mint,
      sqrtPrice: whirlpool_data.sqrtPrice,
      tickCurrentIndex: whirlpool_data.tickCurrentIndex,

      // Price range
      tickLowerIndex: lower_tick_index,
      tickUpperIndex: upper_tick_index,

      // Input token and amount
      inputTokenMint: sol,
      inputTokenAmount: DecimalUtil.toBN(new Decimal(wsol), 9),

      // Acceptable slippage
      slippageTolerance: Percentage.fromFraction(
        slippage * 10 ** slippageDecimalCount,
        100 * 10 ** slippageDecimalCount,
      ),
    });

    const solMax = DecimalUtil.fromBN(
      quote.tokenMaxA,
      token_a.decimals,
    ).toFixed(token_a.decimals);

    const olasMax = DecimalUtil.fromBN(
      quote.tokenMaxB,
      token_b.decimals,
    ).toFixed(token_b.decimals);

    const liquidity = quote.liquidityAmount.toString();

    return { solMax, olasMax, liquidity };
    // console.log(quote);
    // return quote;
  };

  return increaseLiquidityQuote;
};
