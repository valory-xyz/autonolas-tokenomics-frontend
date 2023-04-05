import { ethers } from 'ethers';
import dayjs from 'dayjs';
import { notification } from 'antd/lib';
import { isNil, isObject } from 'lodash';
import { COLOR } from '@autonolas/frontend-library';
import { NA } from 'common-util/constants';

/**
 * https://docs.ethers.org/v5/api/utils/constants/#constants-MaxUint256
 */
export const MAX_AMOUNT = ethers.constants.MaxUint256;

export const ADDRESS_ZERO = ethers.constants.AddressZero;

export const ONE_ETH = ethers.constants.WeiPerEther;

export const getBlockTimestamp = async (block = 'latest') => {
  const temp = await window?.WEB3_PROVIDER.eth.getBlock(block);
  return temp.timestamp * 1;
};

/**
 *
 * @param {BigNumebr} value value to be converted to Eth
 * @param {Number} dv Default value to be returned
 * @returns {String} with 2 decimal places
 */
export const formatToEth = (value, dv = 0) => {
  if (isNil(value)) return dv || 0;
  return (+ethers.utils.formatEther(value)).toFixed(2);
};

/**
 * Same as `formatToEth` but doesn't fixes the decimal to 8
 * @returns {String} eg: 1000000000000000000 => 1
 */
export const parseToEth = (amount) => (amount ? ethers.utils.formatEther(`${amount}`) : 0);

/**
 * multiplies the amount by 10^18
 */
export const parseToWei = (amount) => ethers.utils.parseUnits(`${amount}`, 18).toString();

/**
 * parse eth to wei
 * example 1 => 1000000000000000000
 */
export const parseEther = (n) => ethers.utils.parseEther(`${n}`);

export const notifyError = (message = 'Some error occured') => notification.error({
  message,
  style: { border: `1px solid ${COLOR.PRIMARY}` },
});

export const notifySuccess = (message = 'Successfull', description = null) => notification.success({
  message,
  description,
  style: { border: `1px solid ${COLOR.PRIMARY}` },
});

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
      return 'You do not have any incentives to claim';
    }

    if ((error?.message || '').includes('TransferFailed')) {
      return 'Transfer failed';
    }
  }

  return 'Some error occured';
};

export const notifySpecificError = (error) => {
  const message = getErrorMessage(error);
  notifyError(message);
};

/**
 * Converts a number to a compact format
 * @param {Number} x
 * @returns {String} eg: 1000000 => 1M, 12345.67 => 12.35K
 */
export const getFormattedNumber = (x) => {
  if (isNil(x)) return '0';

  // if < 9999 then show 2 decimal places with comma
  // if (x < 9999) return x.toLocaleString('en', { maximumFractionDigits: 2 });

  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(x);
};

/**
 * Converts a number to a comma separated format
 * @param {Number} x
 * @returns {String} eg: 1000000 => 1,000,000, 12345.67 => 12,345.67
 */
export const getCommaSeparatedNumber = (x) => {
  if (isNil(x) || Number(x) === 0) return '0.0';

  return new Intl.NumberFormat('en', {
    maximumFractionDigits: 2,
  }).format(x);
};

/**
 * Get formatted date from milliseconds
 * example, 1678320000000 => Mar 09 '23
 */
export const getFormattedDate = (ms) => {
  if (!ms) return NA;
  return dayjs(ms).format("MMM DD 'YY");
};

/**
 * Get formatted date from milliseconds including time
 * example, 1678320000000 => Mar 09 '2023 16:00
 */
export const getFullFormattedDate = (ms) => {
  if (!ms) return NA;
  return dayjs(ms).format("MMM DD 'YYYY, HH:mm");
};
