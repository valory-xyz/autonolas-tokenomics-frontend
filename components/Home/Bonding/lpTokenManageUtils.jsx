/* eslint-disable camelcase */
import {
  // AnchorProvider,
  setProvider,
  web3,
  getProvider,
  Program,
} from '@coral-xyz/anchor';
import idl from 'common-util/AbiAndAddresses/liquidityLockbox.json';
// import idl_whirlpool from 'common-util/AbiAndAddresses/whirlpool.json';
import { AnchorProvider } from '@project-serum/anchor';
import NodeWallet from '@project-serum/anchor/dist/cjs/nodewallet';

import { DecimalUtil, Percentage } from '@orca-so/common-sdk';
import Decimal from 'decimal.js';
import {
  WhirlpoolContext,
  buildWhirlpoolClient,
  // ORCA_WHIRLPOOL_PROGRAM_ID,
  PDAUtil,
  // PoolUtil,
  // PriceMath,
  increaseLiquidityQuoteByInputTokenWithParams,
  // decreaseLiquidityQuoteByLiquidityWithParams,
  TickUtil,
} from '@orca-so/whirlpools-sdk';
import { useConnection } from '@solana/wallet-adapter-react';
import { Keypair } from '@solana/web3.js';
import {
  createMint,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  syncNative,
} from '@solana/spl-token';
import { useCallback } from 'react';

const PROGRAM_ID = new web3.PublicKey(
  '7ahQGWysExobjeZ91RTsNqTCN3kWyHGZ43ud2vB7VVoZ',
);
const orca = new web3.PublicKey('whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc');
const whirlpool = new web3.PublicKey(
  '5dMKUYJDsjZkAD3wiV3ViQkuq9pSmWQ5eAzcQLtDnUT3',
);
const sol = new web3.PublicKey('So11111111111111111111111111111111111111112');
const wallet = new NodeWallet(Keypair.generate());

const tickSpacing = 64;
const [lower_tick_index, upper_tick_index] = TickUtil.getFullRangeTickIndex(tickSpacing);

export const useDepositEstimation = () => {
  const { connection } = useConnection();
  const provider = new AnchorProvider(connection, wallet);
  setProvider(provider);

  const ctx = WhirlpoolContext.withProvider(provider, orca);
  const client = buildWhirlpoolClient(ctx);

  const getWhirlpoolData = useCallback(async () => {
    const whirlpoolClient = await client.getPool(whirlpool);

    const whirlpool_data = whirlpoolClient.getData();
    const token_a = whirlpoolClient.getTokenAInfo();
    const token_b = whirlpoolClient.getTokenBInfo();

    return { whirlpool_data, token_a, token_b };
  }, []);

  const increaseLiquidity = async ({ wsol, slippage }) => {
    const { whirlpool_data, token_a, token_b } = await getWhirlpoolData();
    const slippageTolerance = Percentage.fromDecimal(new Decimal(slippage));

    // console.log({
    //   inputTokenAmount: DecimalUtil.toBN(new Decimal(wsol), 9).toString(),
    //   slippage,
    //   slippageTolerance: slippageTolerance.toString(),
    // });

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

  // { wsol, slippage }
  const deposit = async () => {
    const { whirlpool_data, token_a, token_b } = await getWhirlpoolData();

    const program = new Program(idl, PROGRAM_ID, provider);

    // Get all the accounts for the initial zero position
    const positionMintKeypair = web3.Keypair.generate();
    const positionMint = positionMintKeypair.publicKey;
    console.log('positionMint:', positionMint.toBase58());

    const positionPda = PDAUtil.getPosition(orca, positionMint);
    const position = positionPda.publicKey;
    console.log('position:', position);

    const [pdaProgram, _bump] = await web3.PublicKey.findProgramAddress(
      [Buffer.from('liquidity_lockbox', 'utf-8')],
      program.programId,
    );

    // TODO: which wallet is this?
    // const userWallet = provider.wallet.payer;
    // console.log('User wallet:', userWallet.publicKey.toBase58());
    const userWallet = '0x07b5302e01D44bD5b90C63C6Fb24807946704bFC';

    const bridgedTokenMint = await createMint(
      provider.connection,
      userWallet,
      pdaProgram,
      null,
      8,
    );
    console.log('Bridged token mint:', bridgedTokenMint.toBase58());

    // // ATA for the PDA to store the position NFT
    // const pdaPositionAccount = await getAssociatedTokenAddress(
    //   positionMint,
    //   pdaProgram,
    //   true, // allowOwnerOffCurve - allow pda accounts to be have associated token account
    // );

    console.log('position:', position);

    // Get the ATA of the userWallet address, and if it does not exist, create it
    // This account will have bridged tokens
    // const bridgedTokenAccount = await getOrCreateAssociatedTokenAccount(
    //   provider.connection,
    //   userWallet,
    //   bridgedTokenMint,
    //   userWallet.publicKey,
    // );
    // console.log(
    //   'User ATA for bridged:',
    //   bridgedTokenAccount.address.toBase58(),
    // );

    // Get the tokenA ATA of the userWallet address, and if it does not exist, create it
    // const tokenOwnerAccountA = await getOrCreateAssociatedTokenAccount(
    //   provider.connection,
    //   userWallet,
    //   token_a.mint,
    //   userWallet.publicKey,
    // );
    // console.log('User ATA for tokenA:', tokenOwnerAccountA.address.toBase58());

    // Simulate SOL transfer and the sync of native SOL
    // await provider.connection.requestAirdrop(
    //   tokenOwnerAccountA.address,
    //   100000000000,
    // );
    // await syncNative(
    //   provider.connection,
    //   userWallet,
    //   tokenOwnerAccountA.address,
    // );

    // Get the tokenA ATA of the userWallet address, and if it does not exist, create it
    // const tokenOwnerAccountB = await getOrCreateAssociatedTokenAccount(
    //   provider.connection,
    //   userWallet,
    //   token_b.mint,
    //   userWallet.publicKey,
    // );
    // console.log('User ATA for tokenB:', tokenOwnerAccountB.address.toBase58());

    // // ############################## DEPOSIT ##############################
    // console.log(
    //   '\nSending position NFT to the program in exchange of bridged tokens',
    // );

    // accountInfo = await provider.connection.getAccountInfo(pdaPositionAccount);

    // // Execute the correct deposit tx
    // try {
    //   const signature = await program.methods
    //     .deposit(quote.liquidityAmount, quote.tokenMaxA, quote.tokenMaxB)
    //     .accounts({
    //       position,
    //       pdaPositionAccount,
    //       whirlpool,
    //       tokenOwnerAccountA: tokenOwnerAccountA.address,
    //       tokenOwnerAccountB: tokenOwnerAccountB.address,
    //       tokenVaultA,
    //       tokenVaultB,
    //       tickArrayLower,
    //       tickArrayUpper,
    //       bridgedTokenAccount: bridgedTokenAccount.address,
    //       bridgedTokenMint,
    //       lockbox: pdaProgram,
    //       whirlpoolProgram: orca,
    //     })
    //     .signers([userWallet])
    //     .rpc();

    //   console.log('Deposit Signature:', signature);
    // } catch (error) {
    //   if (error instanceof Error && 'message' in error) {
    //     console.error('Program Error:', error);
    //     console.error('Error Message:', error.message);
    //   } else {
    //     console.error('Transaction Error:', error);
    //   }
    // }
  };

  return { increaseLiquidity, deposit };
};
