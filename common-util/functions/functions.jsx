import { ethers } from 'ethers';
import { notification } from 'antd';
import { isObject } from 'lodash';
import { COLOR } from '@autonolas/frontend-library';

/**
 * https://docs.ethers.org/v5/api/utils/constants/#constants-MaxUint256
 */
export const MAX_AMOUNT = ethers.constants.MaxUint256;

export const ADDRESS_ZERO = ethers.constants.AddressZero;

export const ONE_ETH = ethers.constants.WeiPerEther;

/**
 * Same as `formatToEth` but doesn't fixes the decimal to 8
 * @returns {String} eg: 1000000000000000000 => 1
 */
export const parseToEth = (amount) => (amount ? ethers.utils.formatEther(`${amount}`) : 0);

/**
 * multiplies the amount by 10^18
 */
export const parseToWei = (amount) => ethers.utils.parseUnits(`${amount}`, 18).toString();

export const notifyError = (
  message = 'Some error occured',
  description = null,
) => notification.error({
  message,
  description,
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
      return 'You do not have any rewards to claim';
    }

    if ((error?.message || '').includes('TransferFailed')) {
      return 'Transfer failed';
    }

    if ((error?.message || '').includes('execution reverted')) {
      return 'Nothing to claim for the connected wallet';
    }
  }

  return 'Some error occured';
};

export const notifySpecificError = (error) => {
  const message = getErrorMessage(error);
  notifyError(message);
};

/**
 * TODO: move to autonolas-library and figure out a better way
 * to fetch timestamp
 */
export const getBlockTimestamp = async (block = 'latest') => {
  const temp = await window?.WEB3_PROVIDER.eth.getBlock(block);
  return temp.timestamp * 1;
};

/**
 * - unitIds and unitTypes are arrays of same length
 * - unitIds has to be unique
 */
export const sortUnitIdsAndTypes = (unitIds, unitTypes) => {
  const sortedUnitIds = [...unitIds].sort((a, b) => a - b);
  const sortedUnitTypes = sortedUnitIds.map((e) => unitTypes[unitIds.indexOf(e)]);
  return [sortedUnitIds, sortedUnitTypes];
};
