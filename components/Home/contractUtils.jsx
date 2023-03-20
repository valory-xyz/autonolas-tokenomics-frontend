/* eslint-disable max-len */
// import { ethers } from 'ethers';
import { sendTransaction } from '@autonolas/frontend-library';
// import { MAX_AMOUNT, parseEther } from 'common-util/functions';
import {
  getDepositoryContract,
  getDispenserContract,
  getTokenomicsContract,
} from 'common-util/Contracts';

/**
 * Tokenomics contract
 */
export const getOwnerIncentivesRequest = ({
  account,
  chainId,
  unitTypes,
  unitIds,
}) => new Promise((resolve, reject) => {
  const contract = getTokenomicsContract(window.MODAL_PROVIDER, chainId);

  const fn = contract.methods
    .getOwnerIncentives(account, unitTypes, unitIds)
    .send({ from: account });

  sendTransaction(fn, account)
    .then((response) => resolve(response?.transactionHash))
    .catch((e) => {
      window.console.log('Error occured on fetching owner incentives');
      reject(e);
    });
});

/**
 * Dispenser contract
 */
export const claimOwnerIncentivesRequest = ({
  account,
  chainId,
  unitTypes,
  unitIds,
}) => new Promise((resolve, reject) => {
  const contract = getDispenserContract(window.MODAL_PROVIDER, chainId);

  const fn = contract.methods
    .claimOwnerIncentives(unitTypes, unitIds)
    .send({ from: account });

  sendTransaction(fn, account)
    .then((response) => resolve(response?.transactionHash))
    .catch((e) => {
      window.console.log('Error occured on claiming owner incentives');
      reject(e);
    });
});

/**
 * Depository contract
 */
export const getDepositoryContractRequest = ({
  account,
  chainId,
  serviceIds,
  amounts,
}) => new Promise((resolve, reject) => {
  const contract = getDepositoryContract(window.MODAL_PROVIDER, chainId);

  const fn = contract.methods
    .depositServiceDonationsETH(serviceIds, amounts)
    .send({ from: account });

  sendTransaction(fn, account)
    .then((response) => resolve(response?.transactionHash))
    .catch((e) => {
      window.console.log('Error occured on depositing service donation');
      reject(e);
    });
});
