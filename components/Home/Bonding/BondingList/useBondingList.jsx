import { useCallback, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { memoize, round, get } from 'lodash';
import { BalancerSDK } from '@balancer-labs/sdk';
import { areAddressesEqual } from '@autonolas/frontend-library';

import { DEX } from 'util/constants';
import {
  ADDRESS_ZERO,
  ONE_ETH,
  getChainId,
  isL1Network,
  parseToEth,
  notifySpecificError,
} from 'common-util/functions';
import {
  getDepositoryContract,
  getUniswapV2PairContract,
  getTokenomicsContract,
  getErc20Contract,
  ADDRESSES,
  RPC_URLS,
} from 'common-util/Contracts';
import { useHelpers } from 'common-util/hooks/useHelpers';
import {
  getProductValueFromEvent,
  getLpTokenWithDiscount,
  getLpTokenLink,
  getCurrentPriceLpLink,
  getProductEvents,
  getCalculatedPriceLp,
} from './utils';
import { useWhirlPoolInformation } from '../TokenManagement/hooks/useWhirlpool';

const { BigNumber } = ethers;
const SUPPLY = 'returnValues.supply';

export const LP_PAIRS = {
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
  svm: {
    lpChainId: 'svm',
    name: 'OLAS-WSOL',
    originAddress: '', // TODO: will be sent later- origin address is the position
    dex: DEX.SOLANA,
    poolId: ADDRESSES.svm.balancerVault,
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

/**
 * Fetches detials of the LP token.
 * The token needs to distinguish between the one on the ETH mainnet
 * and the mirrored one from other mainnets.
 *
 * @returns {Object} { lpChainId, originAddress, dex, name, poolId }
 * }
 */
const getLpTokenDetails = memoize(async (address) => {
  // TODO: check for solana
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
});

const getCurrentPriceBalancerFn = memoize(async (tokenAddress) => {
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
  const firstPoolTokenAddress = pool.tokens[0].address;
  const olasTokenAddress = ADDRESSES[lpChainId].olasAddress;
  const reservesOlas = (areAddressesEqual(firstPoolTokenAddress, olasTokenAddress)
    ? pool.tokens[0].balance
    : pool.tokens[1].balance) * 1.0;
  return getCalculatedPriceLp(reservesOlas, totalSupply);
});

/**
 * hook to add the current LP price to the products
 */
const useAddCurrentLpPriceToProducts = () => {
  const getCurrentPriceWhirlpool = useWhirlPoolInformation();

  const getCurrentPriceBalancer = useCallback(getCurrentPriceBalancerFn, [
    getCurrentPriceBalancerFn,
  ]);

  const getCurrentPriceForSvm = useCallback(async () => {
    // @Aleks, I think the below code is not needed and updated
    // because we already know the poolId for solana.
    // const tokenInfo = await getLpTokenDetails(tokenAddress);

    // const priceLp = await getCurrentPriceWhirlpool(tokenInfo.poolId);
    const priceLp = await getCurrentPriceWhirlpool(LP_PAIRS.svm.poolId);
    return priceLp;
  }, [getCurrentPriceWhirlpool]);

  return useCallback(
    async (productList) => {
      const contract = getDepositoryContract();

      const currentLpPricePromiseList = [];
      for (let i = 0; i < productList.length; i += 1) {
        if (productList[i].token === ADDRESS_ZERO) {
          currentLpPricePromiseList.push(0);
        } else {
          /* eslint-disable-next-line no-await-in-loop */
          const { lpChainId, dex } = await getLpTokenDetails(
            productList[i].token,
          );

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
              // currentLpPrice = getCurrentPriceBalancer(productList[i].token);
              // currentLpPricePromiseList.push(currentLpPrice);
              // console.log('currentLpPrice', productList[i].token);

              // TODO: Uncomment to check for Solana, delete once WSOL is live
              currentLpPrice = getCurrentPriceForSvm(productList[i].token);
              currentLpPricePromiseList.push(currentLpPrice);
            } else if (dex === DEX.SOLANA) {
              currentLpPrice = getCurrentPriceForSvm(productList[i].token);
              currentLpPricePromiseList.push(currentLpPrice);
            } else {
              throw new Error('Dex not supported');
            }
          }
        }
      }

      const lpPrices = await Promise.all(currentLpPricePromiseList);
      return productList.map((p, i) => ({ ...p, currentPriceLp: lpPrices[i] }));
    },
    [getCurrentPriceBalancer, getCurrentPriceForSvm],
  );
};

/**
 * Fetches the LP token details for the product list and adds
 * the following details to the list
 * @example
 * input: [{ token: '0x', ...others }]
 * output: [{
 *   ...others,
 *   currentPriceLpLink: 'https://...',
 *   lpChainId: xx,
 *   lpTokenLink: https://...,
 *   lpTokenName: 'OLAS-ETH',
 * }]
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
    const lpTokenLink = getLpTokenLink({
      lpDex: lpTokenDetailsList[index].dex,
      lpChainId,
      lpPoolId: poolId,
      productName: component.token,
    });
    const currentPriceLpLink = getCurrentPriceLpLink({
      lpDex: lpTokenDetailsList[index].dex,
      lpChainId,
    });

    return {
      ...component,
      lpChainId,
      lpTokenName: name,
      lpTokenLink,
      currentPriceLpLink,
    };
  });
};

/**
 * hook to add the supply left to the products
 * @example
 * input: [{ list }]
 * output: [{
 *   ...list,
 *   supplyLeft,
 *   priceLp
 * }]
 */
const useAddSupplyLeftToProducts = () => useCallback(
  async (list, createProductEvents, closedProductEvents = []) => list.map((product) => {
    const createProductEvent = createProductEvents?.find(
      (event) => event?.returnValues?.productId === `${product.id}`,
    );

    const closeProductEvent = closedProductEvents?.find(
      (event) => event?.returnValues?.productId === `${product.id}`,
    );

    // Should not happen but we will warn if it does
    if (!createProductEvent) {
      window.console.warn(
        `Product ${product.id} not found in the event list`,
      );
    }

    const createEventSupply = get(createProductEvent, SUPPLY, 0);
    const eventSupply = BigNumber.from(createEventSupply).div(ONE_ETH);

    const closeProductSupply = get(closeProductEvent, SUPPLY, 0);
    const productSupply = !closeProductEvent
      ? Number(BigNumber.from(product.supply).div(ONE_ETH))
      : Number(BigNumber.from(closeProductSupply).div(ONE_ETH));

    const supplyLeft = productSupply / Number(eventSupply);

    const priceLp = product.token !== ADDRESS_ZERO
      ? product.priceLp
      : createProductEvent.returnValues?.priceLp || 0;

    return { ...product, supplyLeft, priceLp };
  }),
  [],
);

/**
 * Adds the projected change & discounted olas per LP token to the list.
 * Also, multiplies the current price of the LP token by 2
 * @example input: [{ ...list }]
 * @example output: [
 *  { ...list,
 *    fullCurrentPriceLp,
 *    roundedDiscountedOlasPerLpToken,
 *    projectedChange
 *  }
 * ]
 */
const useAddProjectChangeToProducts = () => useCallback(
  (productList) => productList.map((record) => {
    // current price of the LP token is multiplied by 2
    // because the price is for 1 LP token and
    // we need the price for 2 LP tokens
    const fullCurrentPriceLp = Number(round(parseToEth(record.currentPriceLp * 2), 2)) || 0;

    const discountedOlasPerLpToken = getLpTokenWithDiscount(
      record.priceLp || 0,
      record.discount || 0,
    );

    // parse to eth and round to 2 decimal places
    const roundedDiscountedOlasPerLpToken = round(
      parseToEth(discountedOlasPerLpToken),
      2,
    );

    // calculate the projected change
    const difference = roundedDiscountedOlasPerLpToken - fullCurrentPriceLp;
    const projectedChange = round(
      (difference / fullCurrentPriceLp) * 100,
      2,
    );

    return {
      ...record,
      fullCurrentPriceLp,
      roundedDiscountedOlasPerLpToken,
      projectedChange,
    };
  }),
  [],
);

const useAddDiscountToProductList = () => useCallback(async (productList) => {
  const discount = await getLastIDFRequest(); // discount factor is same for all the products
  return productList.map((e) => ({ ...e, discount }));
}, []);

/**
 * Fetches product details from the product ids and updates the list
 * to include other details such as the LP token name, supply left, etc.
 * and returns the updated list.
 */
const useProductDetailsFromIds = ({ retry }) => {
  const addDiscountToProductList = useAddDiscountToProductList();
  const addSupplyLeftToProducts = useAddSupplyLeftToProducts();
  const addCurrentLpPriceToProducts = useAddCurrentLpPriceToProducts();
  const addProjectedChange = useAddProjectChangeToProducts();

  return useCallback(
    async (productIdList) => {
      const contract = getDepositoryContract();

      const createEventList = await getProductEvents('CreateProduct', retry);
      const closedEventList = await getProductEvents('CloseProduct', retry);

      const allListPromise = [];
      for (let i = 0; i < productIdList.length; i += 1) {
        const id = productIdList[i];
        const allListResult = contract.methods.mapBondProducts(id).call();
        allListPromise.push(allListResult);
      }

      const response = await Promise.all(allListPromise);
      const list = response.map((e, i) => ({
        ...e,
        id: productIdList[i],
        priceLp: e.priceLP,
      }));

      const withDiscount = await addDiscountToProductList(list);

      const withCurrentLpPrice = await addCurrentLpPriceToProducts(
        withDiscount,
      );

      const withLpTokens = await getLpTokenNamesForProducts(
        withCurrentLpPrice,
        createEventList,
      );

      const withSupplyList = await addSupplyLeftToProducts(
        withLpTokens,
        createEventList,
        closedEventList,
      );

      const withProjectedChange = addProjectedChange(withSupplyList);

      return withProjectedChange;
    },
    [
      retry,
      addDiscountToProductList,
      addCurrentLpPriceToProducts,
      addSupplyLeftToProducts,
      addProjectedChange,
    ],
  );
};

/**
 * fetches product list based on the active/inactive status
 */
const useProductListRequest = ({ isActive, retry }) => {
  const getProductDetailsFromIds = useProductDetailsFromIds({ retry });

  return useCallback(async () => {
    // const contract = getDepositoryContract();
    // const productIdList = await contract.methods.getProducts(isActive).call();
    const productIdList = ['127'];
    const response = await getProductDetailsFromIds(productIdList);

    const productList = response.map((product, index) => ({
      id: productIdList[index],
      key: productIdList[index],
      ...product,
    }));

    return productList;
  }, [getProductDetailsFromIds, isActive]);
};

export const useProducts = ({ isActive }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [retry, setRetry] = useState(0);
  const [productDetails, setProductDetails] = useState(null); // if `not null`, open deposit modal

  const { chainId } = useHelpers();
  const getProductListRequest = useProductListRequest({ isActive, retry });

  const getProducts = useCallback(async () => {
    try {
      setErrorState(false);
      setIsLoading(true);

      const filteredProductList = await getProductListRequest({
        isActive,
        retry,
      });
      setFilteredProducts(filteredProductList);
    } catch (e) {
      const errorMessage = typeof e?.message === 'string' ? e.message : null;
      setErrorState(true);
      notifySpecificError('Error while fetching products', errorMessage);
      console.error(e, errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [retry, isActive, getProductListRequest]);

  useEffect(() => {
    getProducts();
  }, [getProducts]);

  const handleProductDetails = useCallback(
    (row) => {
      setProductDetails(row);
    },
    [setProductDetails],
  );

  const handleRetry = useCallback(() => {
    setRetry((prev) => prev + 1);
  }, [setRetry]);

  return {
    isLoading,
    errorState,
    filteredProducts,
    retry,
    handleRetry,
    productDetails,
    handleProductDetails,
    depositoryAddress: ADDRESSES[chainId].depository,
    refetch: getProducts,
  };
};
