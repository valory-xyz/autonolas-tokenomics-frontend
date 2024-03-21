import { ethers } from 'ethers';
import { memoize } from 'lodash';
import { notifyError } from '@autonolas/frontend-library';

import { DEX } from 'util/constants';
import {
  ADDRESS_ZERO,
  getEthersProvider,
  getChainId,
  delay,
} from 'common-util/functions';
import { getDepositoryContract, ADDRESSES } from 'common-util/Contracts';

const { BigNumber } = ethers;

export const getProductValueFromEvent = (product, events, keyName) => {
  if ((events || []).length === 0) {
    return product[keyName];
  }

  if (product.token !== ADDRESS_ZERO) {
    return product[keyName];
  }

  const event = events?.find(
    (e) => e?.productId === `${product.id}`,
  );
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

const getProductEventsNonMemoized = async (eventName, retry) => {
  const contract = getDepositoryContract();
  const provider = getEthersProvider();
  const block = await provider.getBlock('latest');

  // handle forked chains with very high chain IDs because they are
  // bad at handling large event lookbacks, hence 50 blocks.
  // Also, previous 200000 blocks means approximately 200000 * 15s = 50 days
  // Try to adjust the lookbackBlockCount if you are running into issues
  // such as events not being fetched.
  const lookbackBlockCount = (getChainId() || 1) >= 100000 ? 50 : 350000;
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
        .getPastEvents(eventName, { fromBlock, toBlock })
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
/**
 * returns events for the product creation
 */
export const getProductEvents = memoize(getProductEventsNonMemoized);

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
  }

  if (lpDex === DEX.SOLANA) {
    return `https://solscan.io/account/${ADDRESSES[lpChainId].balancerVault}`;
  }

  return new Error('Dex not supported');
};
