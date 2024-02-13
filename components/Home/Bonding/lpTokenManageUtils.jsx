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
  decreaseLiquidityQuoteByLiquidityWithParams,
} from '@orca-so/whirlpools-sdk';
import { useConnection } from '@solana/wallet-adapter-react';
import { Keypair } from '@solana/web3.js';
import {
  AccountLayout,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { useCallback } from 'react';
import { notifyError, notifySuccess } from '@autonolas/frontend-library';

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
  'So11111111111111111111111111111111111111112', // TODO: dummy address for now, real one will be added later
);
const PDA_POSITION_ACCOUNT = new web3.PublicKey(
  'So11111111111111111111111111111111111111112', // TODO: dummy address for now, real one will be added later
);
const FEE_COLLECTOR_TOKEN_OWNER_ACCOUNT_A = new web3.PublicKey(
  'So11111111111111111111111111111111111111112', // TODO: dummy address for now, real one will be added later
);
const FEE_COLLECTOR_TOKEN_OWNER_ACCOUNT_B = new web3.PublicKey(
  'So11111111111111111111111111111111111111112', // TODO: dummy address for now, real one will be added later
);
const LOCKBOX = new web3.PublicKey(
  'So11111111111111111111111111111111111111112', // TODO: dummy address for now, real one will be added later
);
const POSITION = new web3.PublicKey(
  'So11111111111111111111111111111111111111112', // TODO: dummy address for now, real one will be added later
);
const POSITION_MINT = new web3.PublicKey(
  'So11111111111111111111111111111111111111112', // TODO: dummy address for now, real one will be added later
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
    const whirlpoolTokenA = whirlpoolClient.getTokenAInfo();
    const whirlpoolTokenB = whirlpoolClient.getTokenBInfo();

    return { whirlpoolData, whirlpoolTokenA, whirlpoolTokenB };
  }, []);

  const increaseLiquidity = async ({ wsol, slippage }) => {
    const { whirlpoolData, whirlpoolTokenA, whirlpoolTokenB } = await getWhirlpoolData();
    const slippageTolerance = Percentage.fromDecimal(new Decimal(slippage));

    const quote = increaseLiquidityQuoteByInputTokenWithParams({
      // Pass the pool definition and state
      tokenMintA: whirlpoolTokenA.mint,
      tokenMintB: whirlpoolTokenB.mint,
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

    return quote;
  };

  const getTransformedQuote = async (quote) => {
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

  const deposit = async ({ wsol, slippage, userWallet }) => {
    if (!userWallet) {
      // notifyError();
      return;
    }

    const program = new Program(idl, PROGRAM_ID, provider);

    const { whirlpoolTokenA, whirlpoolTokenB } = await getWhirlpoolData();
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

    const tokenOwnerAccountA = await getAssociatedTokenAddress(
      whirlpoolTokenA.mint,
      userWallet.publicKey,
    );

    const tokenOwnerAccountB = await getAssociatedTokenAddress(
      whirlpoolTokenB.mint,
      userWallet.publicKey,
    );

    // if()
    /**
     * TODO:
     * if tokenOwnerAccountA = 0x111... then throw error OR
     * if tokenOwnerAccountB = 0x111... then throw error OR
     * else continue
     */

    // Execute the correct deposit tx
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
      console.log('Deposit Signature:', signature);
    } catch (error) {
      if (error instanceof Error && 'message' in error) {
        console.error(error);
      } else {
        console.error('Transaction Error:', error);
      }
    }
  };

  /** ******** WITHDRAW and helpers hooks ********* */
  const withdrawTransformedQuote = async (quote) => {
    const { whirlpoolTokenA, whirlpoolTokenB } = await getWhirlpoolData();

    const wsolMin = DecimalUtil.fromBN(
      quote.tokenMinA,
      whirlpoolTokenA.decimals,
    ).toFixed(whirlpoolTokenA.decimals);

    const olasMin = DecimalUtil.fromBN(
      quote.tokenMinB,
      whirlpoolTokenB.decimals,
    ).toFixed(whirlpoolTokenB.decimals);

    return { wsolMin, olasMin };
  };

  const withdrawDecreaseLiquidity = async ({ amount, slippage }) => {
    const { whirlpoolData } = await getWhirlpoolData();
    const slippageTolerance = Percentage.fromDecimal(new Decimal(slippage));

    const quote = decreaseLiquidityQuoteByLiquidityWithParams({
      sqrtPrice: whirlpoolData.sqrtPrice,
      tickCurrentIndex: whirlpoolData.tickCurrentIndex,
      tickLowerIndex,
      tickUpperIndex,
      liquidity: DecimalUtil.toBN(new Decimal(amount), 9),
      slippageTolerance,
    });

    return quote;
  };

  const withdraw = async ({ userWallet, slippage }) => {
    /**
     * TODO: upside down  of the form deposit
     * 1. Amount: 1 to MAX amount
     * 2. Slippage: 1 to 100
     * 3. WSOL (min token A): uneditable
     * 4. OLAS (min token B): uneditable
     *
     * WITHDRAW button
     */
    // Set acceptable slippage

    const { whirlpoolTokenA, whirlpoolTokenB } = await getWhirlpoolData();

    const bridgedTokenAccount = await getAssociatedTokenAddress(
      BRIDGED_TOKEN_MINT,
      userWallet.publicKey,
    );
    // TODO: If bridgedTokenAccount does NOT exists, throw an error

    // TODO: any balance from 0 to user's balance => user input
    const amount = 1; // (add a max button => user's balance)

    const tokenAccounts = await provider.connection.getTokenAccountsByOwner(
      userWallet.publicKey,
      { programId: TOKEN_PROGRAM_ID },
    );

    let maxAmount = 0;
    tokenAccounts.value.forEach((tokenAccount) => {
      const accountData = AccountLayout.decode(tokenAccount.account.data);
      if (accountData.mint.toString() === BRIDGED_TOKEN_MINT.toString()) {
        if (tokenAccount.pubkey.toString() === bridgedTokenAccount) {
          // then all good
        } else {
          notifyError(); // TODO
        }
        maxAmount = accountData.amount.toString();
        console.log(
          'User ATA bridged balance now:',
          accountData.amount.toString(),
        );
      }
    });
    console.log('Max amount:', maxAmount);

    const program = new Program(idl, PROGRAM_ID, provider);

    console.log(
      'User ATA for bridged:',
      bridgedTokenAccount.address.toBase58(),
    );

    // Get the tokenA ATA of the userWallet address, and if it does not exist, create it
    const tokenOwnerAccountA = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      userWallet,
      whirlpoolTokenA.mint,
      userWallet.publicKey,
    );
    console.log('User ATA for tokenA:', tokenOwnerAccountA.address.toBase58());

    // Get the tokenA ATA of the userWallet address, and if it does not exist, create it
    const tokenOwnerAccountB = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      userWallet,
      whirlpoolTokenB.mint,
      userWallet.publicKey,
    );
    console.log('User ATA for tokenB:', tokenOwnerAccountB.address.toBase58());

    // Obtain withdraw estimation
    const quote = await withdrawDecreaseLiquidity({ amount, slippage });

    try {
      const signature = await program.methods
        .withdraw(amount, quote.tokenMinA, quote.tokenMinB)
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
          tokenOwnerAccountA: tokenOwnerAccountA.address,
          tokenOwnerAccountB: tokenOwnerAccountB.address,
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
    // deposit
    increaseLiquidity,
    getTransformedQuote,
    withdraw,

    // withdraw
    withdrawTransformedQuote,
    withdrawDecreaseLiquidity,
    deposit,
  };
};
