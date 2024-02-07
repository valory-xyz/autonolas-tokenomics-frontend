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

const orca = new web3.PublicKey('whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc');

const whirlpool = new web3.PublicKey(
  '5dMKUYJDsjZkAD3wiV3ViQkuq9pSmWQ5eAzcQLtDnUT3',
);
const sol = new web3.PublicKey('So11111111111111111111111111111111111111112');
const wallet = new NodeWallet(Keypair.generate());

// const olas_amount = DecimalUtil.toBN(new Decimal('10' /* olas */), 8);
const sol_amount = DecimalUtil.toBN(new Decimal('10' /* olas */), 9);
const slippage = Percentage.fromFraction(10, 1000); // 1%

const tickSpacing = 64;
const [lower_tick_index, upper_tick_index] = TickUtil.getFullRangeTickIndex(tickSpacing);

export const useDepositEstimation = () => {
  const { connection } = useConnection();

  const abcd = async () => {
    const provider = new AnchorProvider(connection, wallet);
    setProvider(provider);

    const ctx = WhirlpoolContext.withProvider(provider, orca);
    const client = buildWhirlpoolClient(ctx);
    const whirlpoolClient = await client.getPool(whirlpool);

    const whirlpool_data = whirlpoolClient.getData();
    const token_a = whirlpoolClient.getTokenAInfo();
    const token_b = whirlpoolClient.getTokenBInfo();

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
      inputTokenAmount: sol_amount,

      // Acceptable slippage
      slippageTolerance: slippage,
    });

    console.log(quote);
  };

  return abcd;
};
