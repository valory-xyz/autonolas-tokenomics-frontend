import { ethers } from 'ethers';
import { notifyError } from '@autonolas/frontend-library';
import { gql, GraphQLClient } from 'graphql-request';
import { memoize } from 'lodash';

import { DEX } from 'util/constants';
import { ADDRESS_ZERO } from 'common-util/functions';
import { ADDRESSES } from 'common-util/Contracts';

const { BigNumber } = ethers;

export const getProductValueFromEvent = (product, events, keyName) => {
  if ((events || []).length === 0) {
    return product[keyName];
  }

  if (product.token !== ADDRESS_ZERO) {
    return product[keyName];
  }

  const event = events?.find((e) => e?.productId === `${product.id}`);
  if (!event) notifyError('Product not found in the event list');
  return event[keyName];
};

/**
 *
 * @param {Number | String} lpTokenValue
 * @param {Number | String} discount
 */
export const getLpTokenWithDiscount = (lpTokenValue, discount) => {
  const price = ethers.BigNumber.from(lpTokenValue);
  const discountedPriceInBg = price.add(price.mul(discount).div(100));
  return discountedPriceInBg;
};

/**
 *
 * @param {Number | String} reserveOlas
 * @param {Number | String} totalSupply
 */
export const getCalculatedPriceLp = (reserveOlas, totalSupply) => {
  const reserveOlasBG = BigNumber.from(reserveOlas.toString());
  const totalSupplyBG = BigNumber.from(totalSupply.toString());

  const priceLp = reserveOlasBG
    .mul(`${10 ** 18}`)
    .div(totalSupplyBG)
    .toString();

  return priceLp;
};

/**
 * Function to get the link to the LP token
 */
export const getLpTokenLink = ({
  lpDex, lpChainId, lpPoolId, productName,
}) => {
  if (lpDex === DEX.UNISWAP) {
    return `https://v2.info.uniswap.org/pair/${productName}`;
  }

  if (lpDex === DEX.BALANCER) {
    if (lpChainId === 100) {
      return `https://app.balancer.fi/#/gnosis-chain/pool/${lpPoolId}`;
    }

    if (lpChainId === 137) {
      return `https://app.balancer.fi/#/polygon/pool/${lpPoolId}`;
    }

    if (lpChainId === 42161) {
      return `https://app.balancer.fi/#/arbitrum/pool/${lpPoolId}`;
    }

    if (lpChainId === 10) {
      return `https://app.balancer.fi/#/optimism/pool/${lpPoolId}`;
    }

    if (lpChainId === 8453) {
      return `https://app.balancer.fi/#/base/pool/${lpPoolId}`;
    }
  }

  if (lpDex === DEX.SOLANA) {
    return `https://v1.orca.so/liquidity/browse?tokenMint=${ADDRESSES.svm.olasAddress}&tokenMint=${ADDRESSES.svm.wsolAddress}`;
  }

  return new Error('Dex not supported');
};

/**
 * Function to get the exchange link for the LP token
 */
export const getCurrentPriceLpLink = ({ lpDex, lpChainId }) => {
  if (lpDex === DEX.UNISWAP) {
    const depositoryAddress = ADDRESSES[lpChainId].depository;
    return `https://etherscan.io/address/${depositoryAddress}#readContract#F7`;
  }

  if (lpDex === DEX.BALANCER) {
    if (lpChainId === 100) {
      return `https://gnosisscan.io/address/${ADDRESSES[lpChainId].balancerVault}#readContract#F10`;
    }

    if (lpChainId === 137) {
      return `https://polygonscan.com/address/${ADDRESSES[lpChainId].balancerVault}#readContract#F10`;
    }

    if (lpChainId === 42161) {
      return `https://arbiscan.io/address/${ADDRESSES[lpChainId].balancerVault}#readContract#F10`;
    }

    if (lpChainId === 10) {
      return `https://optimistic.etherscan.io/address/${ADDRESSES[lpChainId].balancerVault}#readContract#F10`;
    }

    if (lpChainId === 8453) {
      return `https://basescan.org/address/${ADDRESSES[lpChainId].balancerVault}#readContract#F10`;
    }
  }

  if (lpDex === DEX.SOLANA) {
    return `https://solscan.io/account/${ADDRESSES[lpChainId].balancerVault}`;
  }

  return new Error('Dex not supported');
};

const getCreateProductEventsFn = async () => {
  const graphQLClient = new GraphQLClient(
    process.env.NEXT_PUBLIC_GRAPH_ENDPOINT_MAINNET,
    {
      method: 'POST',
      jsonSerializer: {
        parse: JSON.parse,
        stringify: JSON.stringify,
      },
    },
  );

  const query = gql`
    query GetCreateProducts {
      createProducts(first: 1000) {
        productId
        token
        priceLP
        supply
        vesting
      }
    }
  `;

  const res = await graphQLClient.request(query);
  return res.createProducts;
};
/**
 * function to get the create product events
 */
export const getCreateProductEvents = memoize(getCreateProductEventsFn);

const getCloseProductEventsFn = async () => {
  const graphQLClient = new GraphQLClient(
    process.env.NEXT_PUBLIC_GRAPH_ENDPOINT_MAINNET,
    {
      method: 'POST',
      jsonSerializer: {
        parse: JSON.parse,
        stringify: JSON.stringify,
      },
    },
  );

  const query = gql`
    query GetCloseProducts {
      closeProducts(first: 1000) {
        productId
        token
        supply
      }
    }
  `;

  const res = await graphQLClient.request(query);
  return res.closeProducts;
};
/**
 * function to get the close product events
 */
export const getCloseProductEvents = memoize(getCloseProductEventsFn);
