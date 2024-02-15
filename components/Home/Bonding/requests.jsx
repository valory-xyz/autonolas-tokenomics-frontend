import { ethers } from 'ethers';
import { BalancerSDK } from '@balancer-labs/sdk';
import { memoize, round } from 'lodash';
import { areAddressesEqual } from '@autonolas/frontend-library';

import { DEX } from 'util/constants';
import {
  MAX_AMOUNT,
  ADDRESS_ZERO,
  ONE_ETH,
  getEthersProvider,
  sendTransaction,
  getChainId,
  isL1Network,
  parseToEth,
  delay,
} from 'common-util/functions';
import {
  getDepositoryContract,
  getUniswapV2PairContract,
  getTokenomicsContract,
  getErc20Contract,
  getGenericBondCalculatorContract,
  ADDRESSES,
  RPC_URLS,
} from 'common-util/Contracts';
import {
  getProductValueFromEvent,
  getLpTokenWithDiscount,
} from './requestsHelpers';
import { getWhirlPoolInformation } from './TokenManagement/useTokenManagement';

const LP_PAIRS = {
  // gnosis-chain
  '0x27df632fd0dcf191C418c803801D521cd579F18e': {
    lpChainId: 100,
    name: 'OLAS-WXDAI',
    originAddress: '0x79C872Ed3Acb3fc5770dd8a0cD9Cd5dB3B3Ac985',
    dex: DEX.BALANCER,
    poolId:
      '0x79c872ed3acb3fc5770dd8a0cd9cd5db3b3ac985000200000000000000000067',
  },
  // polygon
  '0xf9825A563222f9eFC81e369311DAdb13D68e60a4': {
    lpChainId: 137,
    name: 'OLAS-WMATIC',
    originAddress: '0x62309056c759c36879Cde93693E7903bF415E4Bc',
    dex: DEX.BALANCER,
    poolId:
      '0x62309056c759c36879cde93693e7903bf415e4bc000200000000000000000d5f',
  },
  // arbitrum
  '0x36B203Cb3086269f005a4b987772452243c0767f': {
    lpChainId: 42161,
    name: 'OLAS-WETH',
    originAddress: '0xaf8912a3c4f55a8584b67df30ee0ddf0e60e01f8',
    dex: DEX.BALANCER,
    poolId:
      '0xaf8912a3c4f55a8584b67df30ee0ddf0e60e01f80002000000000000000004fc',
  },
  // solana
  '-1': {
    lpChainId: -1, // 126922396888673 (solana), 7565164 (sol)
    name: 'OLAS-WSOL',
    originAddress: '', // origin address is the position (TODO: will be sent later)
    dex: DEX.SOLANA,
    poolId: '5dMKUYJDsjZkAD3wiV3ViQkuq9pSmWQ5eAzcQLtDnUT3', // whirlpool address
  },
};

/**
 * fetches the IDF (discount factor) for the product
 */
const getLastIDFRequest = async () => {
  const contract = getTokenomicsContract();
  const lastIdfResponse = await contract.methods.getLastIDF().call();

  /**
   * 1 ETH = 1e18
   * discount = (lastIDF - 1 ETH) / 1 ETH
   */
  const firstDiv = Number(lastIdfResponse) - Number(ONE_ETH);
  const discount = ((firstDiv * 1.0) / Number(ONE_ETH)) * 100;
  return discount;
};

const getBondingProgramsRequest = async ({ isActive }) => {
  const contract = getDepositoryContract();
  const response = await contract.methods.getProducts(isActive).call();
  console.log('response', response);
  // return response;
  return ['125'];
};

/**
 * returns events for the product creation
 */
const getProductEventsFn = async (eventName, retry) => {
  const contract = getDepositoryContract();
  const provider = getEthersProvider();
  const block = await provider.getBlock('latest');

  // handle forked chains with very high chain IDs because they are
  // bad at handling large event lookbacks, hence 50 blocks.
  // Also, previous 200000 blocks means approximately 200000 * 15s = 50 days
  // Try to adjust the lookbackBlockCount if you are running into issues
  // such as events not being fetched.
  const lookbackBlockCount = (getChainId() || 1) >= 100000 ? 50 : 300000;
  const chunkSize = retry > 0 ? 500 : 50000;
  const eventPromises = [];
  const delayBetweenRequestsInMs = 100;

  for (
    let fromBlock = block.number - lookbackBlockCount;
    fromBlock <= block.number;
    fromBlock += chunkSize
  ) {
    const toBlock = Math.min(fromBlock + chunkSize - 1, block.number);
    eventPromises.push(
      contract
        .getPastEvents(eventName, {
          fromBlock,
          toBlock,
        })
        .then((events) => ({ fromBlock, toBlock, events })),
    );
  }

  // Introduce delays between each chunk request without using await inside the loop
  const eventsChunks = await Promise.all(
    /* eslint-disable-next-line max-len */
    eventPromises.map((p, index) => p.then((result) => delay(index * delayBetweenRequestsInMs).then(() => result.events))),
  );

  const events = eventsChunks.flat();

  return events;
};
const getProductEvents = memoize(getProductEventsFn);

/**
 * Fetches detials of the LP token.
 * The token needs to distinguish between the one on the ETH mainnet
 * and the mirrored one from other mainnets.
 *
 * @returns {Object} {
 *  lpChainId,
 *  originAddress,
 *  dex,
 *  name,
 *  poolId
 * }
 */
const getLpTokenDetailsFn = async (address) => {
  const chainId = getChainId();

  const currentLpPairDetails = Object.keys(LP_PAIRS).find(
    (key) => key === address,
  );

  // if the address is in the LP_PAIRS list
  if (currentLpPairDetails) {
    return { ...LP_PAIRS[address] };
  }

  window.console.warn('LP pair not found in the LP_PAIRS list');

  // if the address is not in the LP_PAIRS list
  // (mainnet and goerli)

  let tokenSymbol = null;
  try {
    const contract = getUniswapV2PairContract(address);
    const token0 = await contract.methods.token0().call();
    const token1 = await contract.methods.token1().call();
    const erc20Contract = getErc20Contract(
      token0 === ADDRESSES[chainId].olasAddress ? token1 : token0,
    );
    tokenSymbol = await erc20Contract.methods.symbol().call();
  } catch (error) {
    console.error(
      'Error fetching token0 and token1 from the LP pair contract: ',
      address,
    );
  }

  return {
    lpChainId: chainId,
    name: `OLAS${tokenSymbol ? `-${tokenSymbol}` : ''}`,
    originAddress: address,
    dex: DEX.UNISWAP,
    poolId: null,
  };
};
const getLpTokenDetails = memoize(getLpTokenDetailsFn);

/**
 * Fetches the LP token name for the product list
 * @example
 * input: [{ token: '0x', ...others }]
 * output: [{ token: '0x', lpTokenName: 'OLAS-ETH', ...others }]
 */
const getLpTokenNamesForProducts = async (productList, events) => {
  const lpTokenNamePromiseList = [];

  for (let i = 0; i < productList.length; i += 1) {
    const tokenAddress = getProductValueFromEvent(
      productList[i],
      events,
      'token',
    );
    const tokenDetailsPromise = getLpTokenDetails(tokenAddress);
    lpTokenNamePromiseList.push(tokenDetailsPromise);
  }

  const lpTokenDetailsList = await Promise.all(lpTokenNamePromiseList);

  return productList.map((component, index) => {
    const { name, poolId, lpChainId } = lpTokenDetailsList[index];

    const getLpTokenLink = () => {
      if (lpTokenDetailsList[index].dex === DEX.UNISWAP) {
        return `https://v2.info.uniswap.org/pair/${component.token}`;
      }

      if (lpTokenDetailsList[index].dex === DEX.BALANCER) {
        if (lpChainId === 100) {
          return `https://app.balancer.fi/#/gnosis-chain/pool/${poolId}`;
        }

        if (lpChainId === 137) {
          return `https://app.balancer.fi/#/polygon/pool/${poolId}`;
        }

        if (lpChainId === 42161) {
          return `https://app.balancer.fi/#/arbitrum/pool/${poolId}`;
        }
      }

      if (lpTokenDetailsList[index].dex === DEX.SOLANA) {
        return 'https://v1.orca.so/liquidity/browse?tokenMint=Ez3nzG9ofodYCvEmw73XhQ87LWNYVRM2s7diB5tBZPyM&tokenMint=So11111111111111111111111111111111111111112'; // TODO: mohan will fix it
      }

      return new Error('Dex not supported');
    };

    const getCurrentPriceLpLink = () => {
      if (lpTokenDetailsList[index].dex === DEX.UNISWAP) {
        const depositoryAddress = ADDRESSES[lpChainId].depository;
        return `https://etherscan.io/address/${depositoryAddress}#readContract#F7`;
      }

      if (lpTokenDetailsList[index].dex === DEX.BALANCER) {
        if (lpChainId === 100) {
          return `https://gnosisscan.io/address/${ADDRESSES[lpChainId].balancerVault}#readContract#F10`;
        }

        if (lpChainId === 137) {
          return `https://polygonscan.com/address/${ADDRESSES[lpChainId].balancerVault}#readContract#F10`;
        }

        if (lpChainId === 42161) {
          return `https://arbiscan.io/address/${ADDRESSES[lpChainId].balancerVault}#readContract#F10`;
        }
      }

      if (lpTokenDetailsList[index].dex === DEX.SOLANA) {
        return `https://solscan.io/account/${ADDRESSES[lpChainId].balancerVault}`;
      }

      return new Error('Dex not supported');
    };

    return {
      ...component,
      lpChainId,
      lpTokenName: name,
      lpTokenLink: getLpTokenLink(),
      currentPriceLpLink: getCurrentPriceLpLink(),
    };
  });
};

const getCurrentPriceBalancerFn = async (tokenAddress) => {
  const { lpChainId, poolId } = await getLpTokenDetails(tokenAddress);
  const balancerConfig = { network: lpChainId, rpcUrl: RPC_URLS[lpChainId] };
  const balancer = new BalancerSDK(balancerConfig);
  const pool = await balancer.pools.find(poolId);

  if (!pool) {
    throw new Error(
      `Pool not found on Balancer for poolId: ${poolId} and chainId: ${lpChainId}.`,
    );
  }

  const totalSupply = pool.totalShares;
  const reservesOLAS = (areAddressesEqual(pool.tokens[0].address, ADDRESSES[lpChainId].olasAddress)
    ? pool.tokens[0].balance
    : pool.tokens[1].balance) * 1.0;
  const priceLP = (reservesOLAS * 10 ** 18) / totalSupply;
  return priceLP;
};
const getCurrentPriceBalancer = memoize(getCurrentPriceBalancerFn);

const getCurrentPriceWhirlpoolFn = async (tokenAddress) => {
  const { poolId } = await getLpTokenDetails(tokenAddress);
  const priceLP = await getWhirlPoolInformation(poolId); // TODO: pass connection as first argument
  return priceLP;
};
const getCurrentPriceWhirlpool = memoize(getCurrentPriceWhirlpoolFn);

const getCurrentLpPriceForProducts = async (productList) => {
  const contract = getDepositoryContract();

  const currentLpPricePromiseList = [];
  for (let i = 0; i < productList.length; i += 1) {
    if (productList[i].token === ADDRESS_ZERO) {
      currentLpPricePromiseList.push(0);
    } else {
      /* eslint-disable-next-line no-await-in-loop */
      const { lpChainId, dex } = await getLpTokenDetails(productList[i].token);

      if (isL1Network(lpChainId)) {
        const currentLpPricePromise = contract.methods
          .getCurrentPriceLP(productList[i].token)
          .call();
        currentLpPricePromiseList.push(currentLpPricePromise);
      } else {
        let currentLpPrice = null;
        // NOTE: It could be uniswap for other chains hence this if case.
        // (commented for now)
        // if (dex === DEX.UNISWAP) {
        //   currentLpPricePromise = contract.methods
        //     .getCurrentPriceUniswap(originAddress)
        //     .call();
        //   currentLpPricePromiseList.push(currentLpPricePromise);
        // } else
        if (dex === DEX.BALANCER) {
          currentLpPrice = getCurrentPriceBalancer(productList[i].token);
          currentLpPricePromiseList.push(currentLpPrice);
        } else if (dex === DEX.SOLANA) {
          currentLpPrice = getCurrentPriceWhirlpool(productList[i].token);
          currentLpPricePromiseList.push(currentLpPrice);
        } else {
          throw new Error('Dex not supported');
        }
      }
    }
  }

  const resolvedList = await Promise.all(currentLpPricePromiseList);

  return productList.map((record, index) => ({
    ...record,
    currentPriceLp: resolvedList[index],
  }));
};

export const getListWithSupplyList = async (
  list,
  createProductEvents,
  closedProductEvents = [],
) => list.map((product) => {
  const createProductEvent = createProductEvents?.find(
    (event) => event?.returnValues?.productId === `${product.id}`,
  );

  const closeProductEvent = closedProductEvents?.find(
    (event) => event?.returnValues?.productId === `${product.id}`,
  );

  // Should not happen but we will warn if it does
  if (!createProductEvent) {
    window.console.warn(`Product ${product.id} not found in the event list`);
  }

  const eventSupply = Number(
    ethers.BigNumber.from(createProductEvent.returnValues.supply).div(
      ONE_ETH,
    ),
  );
  const productSupply = !closeProductEvent
    ? Number(ethers.BigNumber.from(product.supply).div(ONE_ETH))
    : Number(
      ethers.BigNumber.from(closeProductEvent.returnValues.supply).div(
        ONE_ETH,
      ),
    );
  const supplyLeft = productSupply / eventSupply;
  const priceLP = product.token !== ADDRESS_ZERO
    ? product.priceLP
    : createProductEvent?.returnValues?.priceLP || 0;

  return { ...product, supplyLeft, priceLP };
});

/**
 * Adds the projected change & discounted olas per LP token to the list
 */
const getLpPriceWithProjectedChange = (list) => list.map((record) => {
  // current price of the LP token is multiplied by 2
  // because the price is for 1 LP token and
  // we need the price for 2 LP tokens
  const fullCurrentPriceLp = Number(round(parseToEth(record.currentPriceLp * 2), 2)) || '--';

  const discountedOlasPerLpToken = getLpTokenWithDiscount(
    record.priceLP,
    record?.discount || 0,
  );

  // parse to eth and round to 2 decimal places
  const roundedDiscountedOlasPerLpToken = round(
    parseToEth(discountedOlasPerLpToken),
    2,
  );

  // calculate the projected change
  const projectedChange = round(
    ((roundedDiscountedOlasPerLpToken - fullCurrentPriceLp)
        / fullCurrentPriceLp)
        * 100,
    2,
  );

  return {
    ...record,
    fullCurrentPriceLp,
    roundedDiscountedOlasPerLpToken,
    projectedChange,
  };
});

/**
 * Fetches product details from the product ids and updates the list
 * to include other details such as the LP token name, supply left, etc.
 * and returns the updated list.
 */
const getProductDetailsFromIds = async ({ productIdList }, retry) => {
  const contract = getDepositoryContract();

  const allListPromise = [];
  for (let i = 0; i < productIdList.length; i += 1) {
    const id = productIdList[i];
    const allListResult = contract.methods.mapBondProducts(id).call();
    allListPromise.push(allListResult);
  }

  // discount factor is same for all the products
  const discount = await getLastIDFRequest();

  const response = await Promise.all(allListPromise);
  const productList = response.map((product, index) => ({
    ...product,
    discount,
    id: productIdList[index],
  }));

  const listWithCurrentLpPrice = await getCurrentLpPriceForProducts(
    productList,
  );

  const createEventList = await getProductEvents('CreateProduct', retry);
  const closedEventList = await getProductEvents('CloseProduct', retry);

  const listWithLpTokens = await getLpTokenNamesForProducts(
    listWithCurrentLpPrice,
    createEventList,
  );

  const listWithSupplyList = await getListWithSupplyList(
    listWithLpTokens,
    createEventList,
    closedEventList,
  );

  const listWithProjectedChange = getLpPriceWithProjectedChange(listWithSupplyList);

  return listWithProjectedChange;
};

/**
 * fetches product list based on the active/inactive status
 */
export const getProductListRequest = async ({ isActive }, retry) => {
  const productIdList = await getBondingProgramsRequest({ isActive });
  const response = await getProductDetailsFromIds({ productIdList }, retry);
  const discount = await getLastIDFRequest(); // discount factor is same for all the products

  const productList = response.map((product, index) => ({
    id: productIdList[index],
    key: productIdList[index],
    discount,
    ...product,
  }));

  return productList;
};

export const hasSufficientTokenRequest = async ({
  account,
  chainId,
  token: productToken,
  tokenAmount,
}) => {
  const contract = getUniswapV2PairContract(productToken);
  const treasuryAddress = ADDRESSES[chainId].treasury;
  const response = await contract.methods
    .allowance(account, treasuryAddress)
    .call();

  // if allowance is greater than or equal to token amount
  // then user has sufficient token
  const hasEnoughAllowance = ethers.BigNumber.from(response).gte(
    ethers.BigNumber.from(tokenAmount),
  );
  return hasEnoughAllowance;
};

/**
 * Approves the treasury contract to spend the token
 */
export const approveRequest = async ({ account, chainId, token }) => {
  const contract = getUniswapV2PairContract(token);
  const treasuryAddress = ADDRESSES[chainId].treasury;

  const fn = contract.methods
    .approve(treasuryAddress, MAX_AMOUNT)
    .send({ from: account });

  const response = await sendTransaction(fn, account);
  return response;
};

/**
 * Deposits the token
 */
export const depositRequest = async ({ account, productId, tokenAmount }) => {
  const contract = getDepositoryContract();

  const fn = contract.methods
    .deposit(productId, tokenAmount)
    .send({ from: account });

  const response = await sendTransaction(fn, account);
  return response?.transactionHash;
};

export const getLpBalanceRequest = async ({ account, token }) => {
  const contract = getUniswapV2PairContract(token);
  const response = await contract.methods.balanceOf(account).call();
  return response.toString();
};

export const bondCalculationRequest = async ({ tokenAmount, priceLP }) => {
  const contract = getGenericBondCalculatorContract();
  const response = await contract.methods
    .calculatePayoutOLAS(tokenAmount, priceLP)
    .call();
  return response;
};
