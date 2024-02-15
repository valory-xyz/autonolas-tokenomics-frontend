import { ethers } from 'ethers';
import { notifyError } from '@autonolas/frontend-library';

import { ADDRESS_ZERO } from 'common-util/functions';
import { DEX } from 'util/constants';
import { ADDRESSES } from 'common-util/Contracts';

export const getProductValueFromEvent = (product, events, keyName) => {
  if ((events || []).length === 0) {
    return product[keyName];
  }

  if (product.token !== ADDRESS_ZERO) {
    return product[keyName];
  }

  const event = events?.find(
    (e) => e?.returnValues?.productId === `${product.id}`,
  );
  if (!event) notifyError('Product not found in the event list');
  return event.returnValues[keyName];
};

// FUNCTIONS FOR CALCULATIONS

/**
 *
 * @param {BigNumber} lpTokenValue
 * @param {Number} discount
 * @returns {BigNumber}
 */
export const getLpTokenWithDiscount = (lpTokenValue, discount) => {
  const price = ethers.BigNumber.from(lpTokenValue);
  const discountedPrice = price.add(price.mul(discount).div(100));
  return discountedPrice;
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
  }

  if (lpDex === DEX.SOLANA) {
    return `https://v1.orca.so/liquidity/browse?tokenMint=${ADDRESSES.svm.olasAddress}&tokenMint=So11111111111111111111111111111111111111112`;
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
  }

  if (lpDex === DEX.SOLANA) {
    return `https://solscan.io/account/${ADDRESSES[lpChainId].balancerVault}`;
  }

  return new Error('Dex not supported');
};
