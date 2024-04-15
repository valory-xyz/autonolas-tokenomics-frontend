/* eslint-disable max-len */
import { ethers } from 'ethers';
import { isObject } from 'lodash';
import {
  notifyError,
  getProvider as getProviderFn,
  getEthersProvider as getEthersProviderFn,
  getChainId as getChainIdFn,
  getChainIdOrDefaultToMainnet as getChainIdOrDefaultToMainnetFn,
  getIsValidChainId as getIsValidChainIdFn,
  sendTransaction as sendTransactionFn,
  LOCAL_FORK_ID,
} from '@autonolas/frontend-library';

import { RPC_URLS } from 'common-util/Contracts';
import { SUPPORTED_CHAINS } from 'common-util/config/wagmi';

const supportedChains =
  process.env.NEXT_PUBLIC_IS_CONNECTED_TO_LOCAL === 'true'
    ? [...SUPPORTED_CHAINS, { id: LOCAL_FORK_ID }]
    : SUPPORTED_CHAINS;

/**
 * re-usable functions
 */

export const getProvider = () => getProviderFn(supportedChains, RPC_URLS);

export const getEthersProvider = () =>
  getEthersProviderFn(supportedChains, RPC_URLS);

export const getIsValidChainId = (chainId) =>
  getIsValidChainIdFn(supportedChains, chainId);

export const getChainIdOrDefaultToMainnet = (chainId) =>
  getChainIdOrDefaultToMainnetFn(supportedChains, chainId);

export const getChainId = (chainId = null) => {
  if (process.env.NEXT_PUBLIC_IS_CONNECTED_TO_LOCAL === 'true') {
    return LOCAL_FORK_ID;
  }
  return getChainIdFn(supportedChains, chainId);
};

export const sendTransaction = (fn, account) =>
  sendTransactionFn(fn, account, {
    supportedChains,
    rpcUrls: RPC_URLS,
  });

export const ADDRESS_ZERO = ethers.constants.AddressZero;

export const ONE_ETH = ethers.constants.WeiPerEther;

/**
 * Same as `formatToEth` but doesn't fixes the decimal to 8
 * @returns {String} eg: 1000000000000000000 => 1
 */
export const parseToEth = (amount) =>
  amount ? ethers.utils.formatEther(`${amount}`) : 0;

/**
 * multiplies the amount by 10^18
 */
export const parseToWei = (amount) =>
  ethers.utils.parseUnits(`${amount}`, 18).toString();

/**
 * multiplies the amount by 10^8
 */
export const parseToSolDecimals = (amount) =>
  ethers.utils.parseUnits(`${amount}`, 8).toString();

// create a function to specific error message based on error code
const getErrorMessage = (error) => {
  if (isObject(error)) {
    if ((error?.message || '').includes('OwnerOnly')) {
      return 'You are not the owner of the component/agent';
    }

    if ((error?.message || '').includes('WrongUnitId')) {
      return 'Unit ID is not valid';
    }

    if ((error?.message || '').includes('ClaimIncentivesFailed')) {
      return 'You do not have any rewards to claim';
    }

    if ((error?.message || '').includes('TransferFailed')) {
      return 'Transfer failed';
    }

    if ((error?.message || '').includes('execution reverted')) {
      return 'Nothing to claim for the connected wallet';
    }

    return error?.message || 'Some error occured';
  }

  return error || 'Some error occured';
};

export const getErrorDescription = (desc) => {
  // don't show error if it is due to compute units
  if ((desc || '').includes('app has exceeded its compute units ')) {
    return null;
  }

  return desc;
};

export const notifySpecificError = (error, desc) => {
  const message = getErrorMessage(error);
  const description = getErrorDescription(desc);
  notifyError(message, description);
};

/**
 * TODO: move to autonolas-library and figure out a better way
 * to fetch timestamp
 */
export const getBlockTimestamp = async (block = 'latest') => {
  const temp = await window?.WEB3_PROVIDER.eth.getBlock(block);
  return temp.timestamp * 1;
};

export const isL1Network = (chainId) =>
  chainId === 1 || chainId === 5 || chainId === LOCAL_FORK_ID;

/**
 * Creates a promise that resolves after a specified number of milliseconds.
 * This can be used to introduce a delay in an asynchronous operation.
 *
 * @param {number} ms - The number of milliseconds to wait before resolving the promise.
 * @returns {Promise<string>} A promise that resolves with the string 'done' after the delay.
 */
export const delay = (ms) =>
  new Promise((resolve) => {
    setTimeout(() => resolve('done'), ms);
  });
