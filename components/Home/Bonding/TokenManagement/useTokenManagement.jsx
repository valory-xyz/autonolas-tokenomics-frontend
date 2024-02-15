import { useCallback } from 'react';
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
import { Keypair } from '@solana/web3.js';
import {
  AccountLayout,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  createAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  areAddressesEqual,
  notifyError,
  notifySuccess,
} from '@autonolas/frontend-library';

import { useSvmConnectivity } from 'common-util/hooks/useSvmConnectivity';
import { ADDRESSES } from 'common-util/Contracts';
import { round } from 'lodash';
import { SVM_EMPTY_ADDRESS, getMyKeyPair } from './utils';

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

const useManagementProvider = () => {
  const { connection } = useSvmConnectivity();
  const nodeProvider = new AnchorProvider(connection, NODE_WALLET, {
    commitment: 'processed',
  });
  setProvider(nodeProvider);

  return nodeProvider;
};

/**
 * Hook to get the data from the whirlpool
 */
const useWhirlpool = () => {
  const nodeProvider = useManagementProvider();

  const getWhirlpoolData = useCallback(async () => {
    const whirlpoolCtx = WhirlpoolContext.withProvider(nodeProvider, ORCA);
    const client = buildWhirlpoolClient(whirlpoolCtx);
    const whirlpoolClient = await client.getPool(WHIRLPOOL);

    const whirlpoolData = whirlpoolClient.getData();
    const whirlpoolTokenA = whirlpoolClient.getTokenAInfo();
    const whirlpoolTokenB = whirlpoolClient.getTokenBInfo();

    return { whirlpoolData, whirlpoolTokenA, whirlpoolTokenB };
  }, []);

  return { getWhirlpoolData };
};

// TODO: reuse the function somehow because it is needed for bonding list page
export const getWhirlPoolInformation = async (connection, whirlpool) => {
  const nodeProvider = new AnchorProvider(connection, NODE_WALLET, {
    commitment: 'processed',
  });

  const whirlpoolCtx = WhirlpoolContext.withProvider(nodeProvider, ORCA);
  const client = buildWhirlpoolClient(whirlpoolCtx);
  const whirlpoolClient = await client.getPool(whirlpool);

  const whirlpoolTokenA = whirlpoolClient.getTokenAInfo();
  const whirlpoolTokenB = whirlpoolClient.getTokenBInfo();

  // return { whirlpoolData, whirlpoolTokenA, whirlpoolTokenB };

  const tickArrayLower = await whirlpoolCtx.fetcher.getTickArray(
    TICK_ARRAY_LOWER,
  );

  let totalSupply = 0;
  for (let i = 0; i < tickArrayLower.ticks.length; i += 1) {
    totalSupply += tickArrayLower.ticks[i].liquidityNet;
  }

  const reserveOlas = (areAddressesEqual(
    whirlpoolTokenA.mint.toString(),
    ADDRESSES[-1].olasAddress, // TODO: if -1 is changed, update here
  )
    ? whirlpoolTokenA.supply
    : whirlpoolTokenB.supply) * 1.0;

  const priceLP = round((Decimal(reserveOlas) / Decimal(totalSupply)) * 2, 18);
  return priceLP;

  // const reserveToken0 = (await whirlpoolCtx.fetcher.getPoolTokenAccount(whirlpoolTokenA.mint)).amount;
  // for tick in tick_array_lower.ticks:
  //     current_supply += tick.liquidity_net
  // if REVERSE:
  //     reserve_token0 = (await ctx.fetcher.get_token_account(whirlpool.token_vault_a)).amount
  //     reserve_token1 = (await ctx.fetcher.get_token_account(whirlpool.token_vault_b)).amount
  //     currentOLASPrice = (reserve_token0 / (reserve_token1 * 10 **(decimals_a - decimals_b)))
  //     currentPriceLP = round(Decimal(reserve_token1) / Decimal(current_supply) * 2, 18)
  // else:
  //     reserve_token0 = (await ctx.fetcher.get_token_account(whirlpool.token_vault_a)).amount
  //     reserve_token1 = (await ctx.fetcher.get_token_account(whirlpool.token_vault_b)).amount
  //     currentOLASPrice = (reserve_token1 / (reserve_token0 * 10 **(decimals_b - decimals_a)))
  //     currentPriceLP = round(Decimal(reserve_token0) / Decimal(current_supply) * 2, 18)

  // const totalSupply = pool.totalShares;
  // const reservesOLAS = (areAddressesEqual(pool.tokens[0].address, ADDRESSES[lpChainId].olasAddress)
  //   ? pool.tokens[0].balance
  //   : pool.tokens[1].balance) * 1.0;
  // const priceLP = (reservesOLAS * 10 ** 18) / totalSupply;
};

export const useDepositTokenManagement = () => {
  const nodeProvider = useManagementProvider();
  const { getWhirlpoolData } = useWhirlpool();
  const { svmWalletPublicKey, connection, wallet } = useSvmConnectivity();

  const program = new Program(idl, PROGRAM_ID, nodeProvider);
  const userWallet = null; // TODO: need to fix this because it requires secret key

  const depositIncreaseLiquidityQuote = async ({ wsol, slippage }) => {
    const { whirlpoolData, whirlpoolTokenA, whirlpoolTokenB } = await getWhirlpoolData();
    const slippageTolerance = Percentage.fromDecimal(new Decimal(slippage));

    const quote = increaseLiquidityQuoteByInputTokenWithParams({
      tokenMintA: whirlpoolTokenA.mint,
      tokenMintB: whirlpoolTokenB.mint,
      sqrtPrice: whirlpoolData.sqrtPrice,
      tickCurrentIndex: whirlpoolData.tickCurrentIndex,
      tickLowerIndex,
      tickUpperIndex,
      inputTokenMint: SOL,
      inputTokenAmount: DecimalUtil.toBN(new Decimal(wsol), 9),
      slippageTolerance,
    });

    return quote;
  };

  const depositTransformedQuote = async (quote) => {
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
    const quote = depositIncreaseLiquidityQuote({ wsol, slippage });

    const tokenOwnerAccountA = await getAssociatedTokenAddress(
      whirlpoolTokenA.mint,
      svmWalletPublicKey,
    );

    const tokenOwnerAccountB = await getAssociatedTokenAddress(
      whirlpoolTokenB.mint,
      svmWalletPublicKey,
    );

    console.log('Token Owner Account A:', tokenOwnerAccountA.toString());
    console.log('Token Owner Account B:', tokenOwnerAccountB.toString());

    // Check if the user has the correct token account
    // and it is required to deposit
    if (
      tokenOwnerAccountA === SVM_EMPTY_ADDRESS
      || tokenOwnerAccountB === SVM_EMPTY_ADDRESS
    ) {
      notifyError('You do not have the correct token account');
      // return;
    }

    /**
     * resources:
     * 1. https://solana.stackexchange.com/a/2797 - Need to build from scratch
     * 2.
     */

    // const associatedBridgeTokenAccount = await getAssociatedTokenAddress(
    //   BRIDGED_TOKEN_MINT,
    //   svmWalletPublicKey,
    // );

    // console.log('Associated Bridge Token Account:', associatedBridgeTokenAccount.toString());

    // const bridgedTokenAccount = await createAssociatedTokenAccount(
    //   connection,
    //   // getMyKeyPair(),
    //   svmWalletPublicKey,
    //   BRIDGED_TOKEN_MINT,
    //   svmWalletPublicKey,
    // );
    // console.log(
    //   'Trying to trigger createAssociatedTokenAccount for bridged:',
    //   bridgedTokenAccount.address.toBase58(),
    // );

    // Get the ATA of the userWallet address, and if it does not exist, create it
    // This account will have bridged tokens
    const bridgedTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet, // userWallet,
      BRIDGED_TOKEN_MINT,
      svmWalletPublicKey,
    );
    console.log(
      'User ATA for bridged:',
      bridgedTokenAccount.address.toBase58(),
    );

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
      console.log('Deposit Signature:', signature); // TODO: remove
    } catch (error) {
      console.error(error);
    }
  };

  return { depositIncreaseLiquidityQuote, depositTransformedQuote, deposit };
};

export const useWithdrawTokenManagement = () => {
  const nodeProvider = useManagementProvider();
  const { svmWalletPublicKey } = useSvmConnectivity();
  const { getWhirlpoolData } = useWhirlpool();

  const program = new Program(idl, PROGRAM_ID, nodeProvider);

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

  const withdrawDecreaseLiquidityQuote = async ({ amount, slippage }) => {
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

  const getBridgedTokenAccount = async () => {
    if (!svmWalletPublicKey) return null;

    const bridgedTokenAccount = await getAssociatedTokenAddress(
      BRIDGED_TOKEN_MINT,
      svmWalletPublicKey,
    );

    return bridgedTokenAccount;
  };

  /**
   * Fetch the maximum amount of bridged tokens
   * that the user can withdraw. User must have wallet connected
   * to get the maximum amount.
   */
  const getMaxAmount = async () => {
    const bridgedTokenAccount = await getBridgedTokenAccount();
    if (!bridgedTokenAccount) return null;

    const tokenAccounts = await nodeProvider.connection.getTokenAccountsByOwner(
      svmWalletPublicKey,
      { programId: TOKEN_PROGRAM_ID },
    );

    let maxAmount = -1; // initialize to -1

    // Iterate through the token accounts of the user
    // to find the bridged token account
    tokenAccounts.value.forEach((tokenAccount) => {
      const accountData = AccountLayout.decode(tokenAccount.account.data);
      if (accountData.mint.toString() === BRIDGED_TOKEN_MINT.toString()) {
        console.log(
          'Bridged Token Accounts:',
          tokenAccount.pubkey,
          accountData,
          bridgedTokenAccount,
        );

        if (tokenAccount.pubkey.toString() === bridgedTokenAccount) {
          maxAmount = accountData.amount.toString();
        }
      }
    });

    if (maxAmount === -1) {
      notifyError('You do not have the bridged token account yet');
      return null;
    }

    return maxAmount;
  };

  /**
   * Withdraw from the lockbox
   */
  const withdraw = async ({ amount, slippage, userWallet }) => {
    const bridgedTokenAccount = await getBridgedTokenAccount({ userWallet });
    if (!bridgedTokenAccount) {
      notifyError('Please connect your phantom wallet');
      return;
    }

    const { whirlpoolTokenA, whirlpoolTokenB } = await getWhirlpoolData();

    // Get the tokenA ATA of the userWallet address, and if it does not exist, create it
    const tokenOwnerAccountA = await getOrCreateAssociatedTokenAccount(
      nodeProvider.connection,
      userWallet,
      whirlpoolTokenA.mint,
      svmWalletPublicKey,
    );
    console.log('User ATA for tokenA:', tokenOwnerAccountA.address.toBase58());

    // Get the tokenB ATA of the userWallet address, and if it does not exist, create it
    const tokenOwnerAccountB = await getOrCreateAssociatedTokenAccount(
      nodeProvider.connection,
      userWallet,
      whirlpoolTokenB.mint,
      svmWalletPublicKey,
    );
    console.log('User ATA for tokenB:', tokenOwnerAccountB.address.toBase58());

    // Obtain withdraw estimation
    const quote = await withdrawDecreaseLiquidityQuote({ amount, slippage });

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
    withdrawTransformedQuote,
    withdrawDecreaseLiquidityQuote,
    withdraw,
    getMaxAmount,
  };
};
