/* eslint-disable max-len */
/* eslint-disable camelcase */
import { setProvider, web3, Program } from '@coral-xyz/anchor';
import idl from 'common-util/AbiAndAddresses/liquidityLockbox.json';
import { AnchorProvider } from '@project-serum/anchor';
import NodeWallet from '@project-serum/anchor/dist/cjs/nodewallet';

import { DecimalUtil, Percentage } from '@orca-so/common-sdk';
import Decimal from 'decimal.js';
import {
  WhirlpoolContext,
  buildWhirlpoolClient,
  increaseLiquidityQuoteByInputTokenWithParams,
  TickUtil,
} from '@orca-so/whirlpools-sdk';
import { useConnection } from '@solana/wallet-adapter-react';
import { Keypair } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { useCallback } from 'react';
import { notifySuccess } from '@autonolas/frontend-library';

const PROGRAM_ID = new web3.PublicKey(
  '7ahQGWysExobjeZ91RTsNqTCN3kWyHGZ43ud2vB7VVoZ',
);
const ORCA = new web3.PublicKey('whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc');
const WHIRLPOOL = new web3.PublicKey(
  '5dMKUYJDsjZkAD3wiV3ViQkuq9pSmWQ5eAzcQLtDnUT3',
);
const SOL = new web3.PublicKey('So11111111111111111111111111111111111111112');
const NODE_WALLET = new NodeWallet(Keypair.generate());
const BRIDGED_TOKEN_MINT = new web3.PublicKey(
  '', // TODO: will be added
);
const PDA_POSITION_ACCOUNT = new web3.PublicKey(
  '', // TODO: will be added
);
const FEE_COLLECTOR_TOKEN_OWNER_ACCOUNT_A = new web3.PublicKey(
  '', // TODO: will be added
);
const FEE_COLLECTOR_TOKEN_OWNER_ACCOUNT_B = new web3.PublicKey(
  '', // TODO: will be added
);
const LOCKBOX = new web3.PublicKey(
  '', // TODO: will be added
);
const POSITION = new web3.PublicKey(
  '', // TODO: will be added
);
const POSITION_MINT = new web3.PublicKey(
  '', // TODO: will be added
);
const TOKEN_VAULT_A = new web3.PublicKey(
  'CLA8hU8SkdCZ9cJVLMfZQfcgAsywZ9txBJ6qrRAqthLx',
);
const TOKEN_VAULT_B = new web3.PublicKey(
  '6E8pzDK8uwpENc49kp5xo5EGydYjtamPSmUKXxum4ybb',
);
const TICK_ARRAY_LOWER = new web3.PublicKey(
  '3oJAqTKTCdGvLS9zpoBquWvMjwthu9Np67Qp4W8AT843',
);
const TICK_ARRAY_UPPER = new web3.PublicKey(
  'J3eMJUQWLmSsG5VnXVFHCGwakpKmzi4jkNvi3vbCZQ3o',
);
const TICK_SPACING = 64;
const [tickLowerIndex, tickUpperIndex] = TickUtil.getFullRangeTickIndex(TICK_SPACING);

export const useTokenManagement = () => {
  const { connection } = useConnection();
  const provider = new AnchorProvider(connection, NODE_WALLET, {
    commitment: 'processed',
  });
  setProvider(provider);

  const whirlpoolCtx = WhirlpoolContext.withProvider(provider, ORCA);
  const client = buildWhirlpoolClient(whirlpoolCtx);

  const getWhirlpoolData = useCallback(async () => {
    const whirlpoolClient = await client.getPool(WHIRLPOOL);

    const whirlpoolData = whirlpoolClient.getData();
    const token_a = whirlpoolClient.getTokenAInfo();
    const token_b = whirlpoolClient.getTokenBInfo();

    return { whirlpoolData, token_a, token_b };
  }, []);

  const increaseLiquidity = async ({ wsol, slippage }) => {
    const { whirlpoolData, token_a, token_b } = await getWhirlpoolData();
    const slippageTolerance = Percentage.fromDecimal(new Decimal(slippage));

    const quote = increaseLiquidityQuoteByInputTokenWithParams({
      // Pass the pool definition and state
      tokenMintA: token_a.mint,
      tokenMintB: token_b.mint,
      sqrtPrice: whirlpoolData.sqrtPrice,
      tickCurrentIndex: whirlpoolData.tickCurrentIndex,

      // Price range
      tickLowerIndex,
      tickUpperIndex,

      // Input token and amount
      inputTokenMint: SOL,
      inputTokenAmount: DecimalUtil.toBN(new Decimal(wsol), 9),

      // Acceptable slippage
      slippageTolerance,
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

    // console.log({
    //   solMax,
    //   olasMax,
    //   liquidity,
    //   tokenMaxA: quote.tokenMaxA.toString(),
    //   tokenMaxB: quote.tokenMaxB.toString(),
    //   tokenEstA: quote.tokenEstA.toString(),
    //   tokenEstB: quote.tokenEstB.toString(),
    // });

    return {
      solMax,
      olasMax,
      liquidity,
      ...quote,
    };
  };

  const getTransformedQuote = async (quote) => {
    const { token_a, token_b } = await getWhirlpoolData();

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
  };

  const deposit = async ({ wsol, slippage, userWallet }) => {
    const program = new Program(idl, PROGRAM_ID, provider);

    const { token_a, token_b } = await getWhirlpoolData();
    const quote = increaseLiquidity({ wsol, slippage });

    // Get the ATA of the userWallet address, and if it does not exist, create it
    // This account will have bridged tokens
    const bridgedTokenAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      userWallet,
      BRIDGED_TOKEN_MINT,
      userWallet.publicKey,
    );
    console.log(
      'User ATA for bridged:',
      bridgedTokenAccount.address.toBase58(),
    );

    // Get the tokenA ATA of the userWallet address, and if it does not exist, create it
    const tokenOwnerAccountA = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      userWallet,
      token_a.mint,
      userWallet.publicKey,
    );
    console.log('User ATA for tokenA:', tokenOwnerAccountA.address.toBase58());

    // Get the tokenA ATA of the userWallet address, and if it does not exist, create it
    const tokenOwnerAccountB = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      userWallet,
      token_b.mint,
      userWallet.publicKey,
    );
    console.log('User ATA for tokenB:', tokenOwnerAccountB.address.toBase58());

    // Execute the correct deposit tx
    try {
      const signature = await program.methods
        .deposit(quote.liquidityAmount, quote.tokenMaxA, quote.tokenMaxB)
        .accounts({
          position: POSITION,
          pdaPositionAccount: PDA_POSITION_ACCOUNT,
          whirlpool: WHIRLPOOL,
          tokenOwnerAccountA: tokenOwnerAccountA.address, // TODO: input from user
          tokenOwnerAccountB: tokenOwnerAccountB.address, // TODO: input from user
          tokenVaultA: TOKEN_VAULT_A,
          tokenVaultB: TOKEN_VAULT_B,
          tickArrayLower: TICK_ARRAY_LOWER,
          tickArrayUpper: TICK_ARRAY_UPPER,
          bridgedTokenAccount: bridgedTokenAccount.address, // TODO: create this account
          bridgedTokenMint: BRIDGED_TOKEN_MINT,
          lockbox: LOCKBOX,
          whirlpoolProgram: ORCA,
        })
        // .signers([userWallet])
        .rpc();

      notifySuccess('Deposit successful', signature);
      console.log('Deposit Signature:', signature);
    } catch (error) {
      if (error instanceof Error && 'message' in error) {
        console.error(error);
      } else {
        console.error('Transaction Error:', error);
      }
    }
  };

  const withdraw = async ({ userWallet, slippage: zeroAmount }) => {
    const { token_a, token_b } = await getWhirlpoolData();

    // any balance from 0 to user's balance => user input
    const amount = 0; // (add a max button => user's balance)

    const bridgedTokenAccount = await getAssociatedTokenAddress(
      BRIDGED_TOKEN_MINT,
      userWallet.publicKey,
    );

    const tokenOwnerAccountA = await getAssociatedTokenAddress(
      token_a.mint,
      userWallet.publicKey,
    );

    const tokenOwnerAccountB = await getAssociatedTokenAddress(
      token_b.mint,
      userWallet.publicKey,
    );

    const program = new Program(idl, PROGRAM_ID, provider);

    console.log(
      'User ATA for bridged:',
      bridgedTokenAccount.address.toBase58(),
    );

    try {
      const signature = await program.methods
        .withdraw(amount, zeroAmount, zeroAmount)
        .accounts({
          lockbox: LOCKBOX,
          whirlpoolProgram: ORCA,
          whirlpool: WHIRLPOOL,
          tokenProgram: TOKEN_PROGRAM_ID,
          position: POSITION,
          positionMint: POSITION_MINT,
          bridgedTokenAccount,
          bridgedTokenMint: BRIDGED_TOKEN_MINT,
          pdaPositionAccount: PDA_POSITION_ACCOUNT,
          tokenOwnerAccountA,
          tokenOwnerAccountB,
          feeCollectorTokenOwnerAccountA: FEE_COLLECTOR_TOKEN_OWNER_ACCOUNT_A,
          feeCollectorTokenOwnerAccountB: FEE_COLLECTOR_TOKEN_OWNER_ACCOUNT_B,
          tokenVaultA: TOKEN_VAULT_A,
          tokenVaultB: TOKEN_VAULT_B,
          tickArrayLower: TICK_ARRAY_LOWER,
          tickArrayUpper: TICK_ARRAY_UPPER,
        })
        // .signers([userWallet])
        .rpc();

      notifySuccess('Withdraw successful', signature);
      console.log('Withdraw Signature:', signature);
    } catch (error) {
      console.error(error);
    }
  };

  return {
    increaseLiquidity,
    getTransformedQuote,
    deposit,
    withdraw,
  };
};
