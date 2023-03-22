// import { ethers } from 'ethers';
import { sendTransaction } from '@autonolas/frontend-library';
// import { MAX_AMOUNT, parseEther } from 'common-util/functions';
import {
  // getDepositoryContract,
  getDispenserContract,
  getTokenomicsContract,
  getTreasuryContract,
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

  contract.methods
    .getOwnerIncentives(account, unitTypes, unitIds)
    .call()
    .then((response) => {
      window.console.log('response', response);
      resolve(response?.transactionHash);
    })
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
    .then((response) => {
      window.console.log('response', response);
      resolve(response?.transactionHash);
    })
    .catch((e) => {
      window.console.log('Error occured on claiming owner incentives');
      reject(e);
    });
});

/**
 * Treasory contract
 */
export const getDepositoryContractRequest = ({
  account,
  chainId,
  serviceIds,
  amounts,
  totalAmount,
}) => new Promise((resolve, reject) => {
  const contract = getTreasuryContract(window.MODAL_PROVIDER, chainId);

  const fn = contract.methods
    .depositServiceDonationsETH(serviceIds, amounts)
    .send({ from: account, value: totalAmount });

  sendTransaction(fn, account)
    .then((response) => resolve(response?.transactionHash))
    .catch((e) => {
      window.console.log('Error occured on depositing service donation');
      reject(e);
    });
});

/**
 * Bonding functionalities - depository contract
 */
export const depositRequest = ({
  account, chainId, productId, tokenAmount,
}) => new Promise((resolve, reject) => {
  const contract = getDepositoryContractRequest(
    window.MODAL_PROVIDER,
    chainId,
  );

  const fn = contract.methods
    .depositServiceDonationsETH(productId, tokenAmount)
    .send({ from: account });

  sendTransaction(fn, account)
    .then((response) => resolve(response?.transactionHash))
    .catch((e) => {
      window.console.log('Error occured on depositing');
      reject(e);
    });
});

export const redeemRequest = ({ account, chainId, bondIds }) => new Promise((resolve, reject) => {
  const contract = getDepositoryContractRequest(
    window.MODAL_PROVIDER,
    chainId,
  );

  const fn = contract.methods.redeem(bondIds).send({ from: account });

  sendTransaction(fn, account)
    .then((response) => resolve(response?.transactionHash))
    .catch((e) => {
      window.console.log('Error occured on depositing');
      reject(e);
    });
});

/**
 * bonding functionalities (depository and tokenomics contract)
 *
 * - to get the agentIds and componentIds
 * getUnitIdsOfService(IRegistry.UnitType unitType, uint256 serviceId) - ServiceRegistry
 *
 * - Add a button and a input as SERVICE ID and
 * ouput as AGENT IDs and COMPONENT IDs
 *
 * Donate to service
 * - Make sure the exists before deposit - check it using `exists` method
 *
 *
 * claim
 * - Make sure the user is the owner of the unit Id before checking/fetching the incentives
 *
 * use radio-button / dropdown for unit type
 *
 * DEPOSIT function
 * - `getProducts` (input: true): output only active products
 * op: array of productIds which are currently active
 * - list the products in the UI & the token for each product using "mapBondProducts(productId)"
 *
 * - check if there is allowance of the LP token (from product) in treasury contract
 * and if not, then call the approve function + deposit function
 * else call only the deposit function
 *
 * ALTERNATIVE
 * - show "Enable" button if there is no allowance (on click,
 * call the approve function & deposit function)
 * - show "Deposit" button if there is allowance (on click, call the deposit function)
 *
 *
 *- get the full list of product (getProducts from depository contract)
 */
