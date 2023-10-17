import { ethers } from 'ethers';
import { memoize } from 'lodash';
/* eslint-disable-next-line import/no-extraneous-dependencies */
import { BalancerSDK } from '@balancer-labs/sdk';

import {
  MAX_AMOUNT,
  ADDRESS_ZERO,
  ONE_ETH,
  getEthersProvider,
  sendTransaction,
  getChainId,
} from 'common-util/functions';
import {
  getDepositoryContract,
  getUniswapV2PairContract,
  getTokenomicsContract,
  getErc20Contract,
  getGenericBondCalculatorContract,
  ADDRESSES,
  LP_PAIRS,
} from 'common-util/Contracts';
import { getProductValueFromEvent } from './requestsHelpers';

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
  return response;
};

/**
 * returns events for the product creation
 */
export const getProductEvents = async (eventName) => {
  const contract = getDepositoryContract();

  const provider = getEthersProvider();
  const block = await provider.getBlock('latest');

  const oldestBlock = (getChainId() || 1) >= 100000 ? 10 : 1000000;
  const events = contract.getPastEvents(eventName, {
    fromBlock: block.number - oldestBlock,
    toBlock: block.number,
  });

  return events;
};

/**
 * Fetches detials of the LP token.
 * The token needs to distinguish between the one on the ETH mainnet
 * and the mirrored one from other mainnets.
 *
 * @returns {Object} {
 *  chainId,
 *  originAddress,
 *  dex,
 *  name // OLAS-ETH (only key used in the UI for now, rest will be used later),
 * poolId
 * }
 */
const getLpTokenDetails = memoize(async (address) => {
  const chainId = getChainId();

  const currentLpPairDetails = Object.keys(LP_PAIRS).find(
    (key) => LP_PAIRS[key] === address,
  );
  if (currentLpPairDetails) {
    return { ...currentLpPairDetails };
  }

  // if the address is not in the LP_PAIRS list
  // then it's a uniswap pair
  const contract = getUniswapV2PairContract(address);
  const token0 = await contract.methods.token0().call();
  const token1 = await contract.methods.token1().call();
  const erc20Contract = getErc20Contract(
    token0 === ADDRESSES[chainId].olasAddress ? token1 : token0,
  );
  const tokenSymbol = await erc20Contract.methods.symbol().call();

  return {
    chainId,
    name: `OLAS-${tokenSymbol}`,
    originAddress: address,
    dex: 'uniswap',
    poolId: null,
  };
});

/**
 * fetches the LP token name for the product list
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
    const result = getLpTokenDetails(tokenAddress);
    lpTokenNamePromiseList.push(result);
  }

  const lpTokenDetailsList = await Promise.all(lpTokenNamePromiseList);

  return productList.map((component, index) => {
    const { name, poolId, chainId } = lpTokenDetailsList[index];
    const getLpTokenLink = () => {
      if (lpTokenDetailsList[index].dex === 'uniswap') {
        return `https://v2.info.uniswap.org/pair${component.token}`;
      }

      if (lpTokenDetailsList[index].dex === 'balancer' && chainId === 100) {
        return `https://app.balancer.fi/#/gnosis-chain/pool/${poolId}`;
      }

      return new Error('Dex not supported');
    };

    const getCurrentPriceLpLink = () => {
      const depositoryAddress = ADDRESSES[chainId].depository;
      if (lpTokenDetailsList[index].dex === 'uniswap') {
        return `https://etherscan.io/address/${depositoryAddress}#readContract#F7`;
      }

      if (lpTokenDetailsList[index].dex === 'balancer' && chainId === 100) {
        return `https://gnosisscan.io/address/${ADDRESSES[chainId].balancerVault}#readContract#F10`;
      }

      return new Error('Dex not supported');
    };

    return {
      ...component,
      lpTokenName: name,
      lpTokenLink: getLpTokenLink(),
      currentPriceLpLink: getCurrentPriceLpLink(),
    };
  });
};

const getCurrentPriceBalancer = async (addressPassed) => {
  const { chainId, originAddress, poolId } = await getLpTokenDetails(
    addressPassed,
  );

  const balancerConfig = {
    network: chainId,
    // network: Network.GNOSIS,
    rpcUrl: process.env.NEXT_PUBLIC_GNOSIS_URL,
  };
  const balancer = new BalancerSDK(balancerConfig);
  // console.log(balancer);
  // return balancer;

  const pool = await balancer.pools.find(poolId);
  const totalSupply = pool.totalShares;
  let reservesOLAS = pool.tokens[0].balance * 1.0;
  if (pool.tokens[0].address !== originAddress) {
    reservesOLAS = pool.tokens[1].balance * 1.0;
  }
  const priceLP = (reservesOLAS * 10 ** 18 * 2) / totalSupply;
  return priceLP;
};

const getCurrentLpPriceForProducts = async (productList) => {
  const contract = getDepositoryContract();

  const currentLpPricePromiseList = [];
  for (let i = 0; i < productList.length; i += 1) {
    if (productList[i].token === ADDRESS_ZERO) {
      currentLpPricePromiseList.push(0);
    } else {
      // eslint-disable-next-line no-await-in-loop
      const { chainId, originAddress, dex } = await getLpTokenDetails(
        productList[i].token,
      );

      // TODO:
      if (chainId === 1 || chainId === 5) {
        const currentLpPricePromise = contract.methods
          .getCurrentPriceLP(productList[i].token)
          .call();
        currentLpPricePromiseList.push(currentLpPricePromise);
      } else {
        let currentLpPricePromise = null;
        // Note: It could be uniswap for other chains hence this if case.
        // if (dex === 'uniswap') {
        //   currentLpPricePromise = contract.methods
        //     .getCurrentPriceUniswap(originAddress)
        //     .call();
        //   currentLpPricePromiseList.push(currentLpPricePromise);
        // } else
        if (dex === 'balancer') {
          currentLpPricePromise = getCurrentPriceBalancer(originAddress);
          currentLpPricePromiseList.push(currentLpPricePromise);
        } else {
          throw new Error('Dex not supported');
        }

        currentLpPricePromiseList.push(currentLpPricePromise);
      }
    }
  }

  const resolvedList = await Promise.all(currentLpPricePromiseList);

  return productList.map((component, index) => ({
    ...component,
    currentPriceLp: resolvedList[index],
  }));
};

export const getListWithSupplyList = async (
  list,
  createProductEvents,
  closedProductEvents = [],
) => list.map((product) => {
  const createProductEvent = createProductEvents.find(
    (event) => event.returnValues.productId === `${product.id}`,
  );

  const closeProductEvent = closedProductEvents.find(
    (event) => event.returnValues.productId === `${product.id}`,
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
 *
 */
const getProductDetailsFromIds = async ({ productIdList }) => {
  const contract = getDepositoryContract();

  const allListPromise = [];
  for (let i = 0; i < productIdList.length; i += 1) {
    const id = productIdList[i];
    const allListResult = contract.methods.mapBondProducts(id).call();
    allListPromise.push(allListResult);
  }

  const response = await Promise.all(allListPromise);
  const productList = response.map((product, index) => ({
    ...product,
    id: productIdList[index],
  }));

  const createEventList = await getProductEvents('CreateProduct');
  const closedEventList = await getProductEvents('CloseProduct');

  const listWithLpTokens = await getLpTokenNamesForProducts(
    productList,
    createEventList,
  );

  const listWithCurrentLpPrice = await getCurrentLpPriceForProducts(
    listWithLpTokens,
  );

  const listWithSupplyList = await getListWithSupplyList(
    listWithCurrentLpPrice,
    createEventList,
    closedEventList,
  );

  return listWithSupplyList;
};

/**
 * returns all the products that are not removed
 * ie. 1. active products,
 *     2. inactive products,
 *     3. 0 supply + active + inactive (combination of 1, 2, 3)
 */
export const getAllTheProductsNotRemoved = async () => {
  const contract = getDepositoryContract();
  const productsList = await contract.methods.productCounter().call();

  const allListPromise = [];
  for (let i = 0; i < productsList; i += 1) {
    const id = `${i}`;
    const result = contract.methods.mapBondProducts(id).call();
    allListPromise.push(result);
  }

  // discount factor is same for all the products
  const discount = await getLastIDFRequest();

  const response = await Promise.all(allListPromise);
  // add id & discount to the product
  const productWithIds = response.map((product, index) => ({
    ...product,
    discount,
    id: index,
    key: index,
  }));

  const createEventList = await getProductEvents('CreateProduct');
  const closedEventList = await getProductEvents('CloseProduct');

  const listWithLpTokens = await getLpTokenNamesForProducts(
    productWithIds,
    createEventList,
  );

  const listWithCurrentLpPrice = await getCurrentLpPriceForProducts(
    listWithLpTokens,
  );

  const listWithSupplyList = await getListWithSupplyList(
    listWithCurrentLpPrice,
    createEventList,
    closedEventList,
  );

  return listWithSupplyList;
};

/**
 * fetches product list based on the active/inactive status
 */
export const getProductListRequest = async ({ isActive }) => {
  const productIdList = await getBondingProgramsRequest({ isActive });
  // const ex = [...productIdList, 100];
  const response = await getProductDetailsFromIds({ productIdList });
  const discount = await getLastIDFRequest(); // discount factor is same for all the products

  const productList = response.map((product, index) => ({
    id: productIdList[index],
    key: productIdList[index],
    discount,
    ...product,
  }));

  // console.log({ productList });

  // NOTE: random product Id for testing
  // productList.push({
  //   id: '100',
  //   key: '100',
  //   discount: 2,
  //   priceLP: '86251681600680378492',
  //   vesting: '1814400',
  //   token: '0x27df632fd0dcf191C418c803801D521cd579F18e',
  //   supply: '14894577668024172888390',
  //   lpTokenName: 'OLAS-WETH',
  //   lpTokenLink:
  //     'https://v2.info.uniswap.org/pair0x09D1d767eDF8Fa23A64C51fa559E0688E526812F',
  //   currentPriceLp: '99541138073815146660',
  //   supplyLeft: 0.186175,
  // });

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
