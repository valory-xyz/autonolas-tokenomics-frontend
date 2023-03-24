import { sendTransaction } from '@autonolas/frontend-library';
import {
  getDispenserContract,
  getTokenomicsContract,
  getTreasuryContract,
} from 'common-util/Contracts';

// ***************************************************
//                 Tokenomics contract
//  **************************************************

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
    .then((response) => resolve(response))
    .catch((e) => {
      window.console.log('Error occured on fetching owner incentives');
      reject(e);
    });
});

// ***************************************************
//                 Dispenser contract
//  **************************************************
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

// ***************************************************
//                 Treasory contract
//  **************************************************
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

// ***************************************************
//                 Depository contract
//  **************************************************

/**
 * Bonding functionalities
 */
// export const redeemRequest = ({ account, chainId, bondIds }) =>
// new Promise((resolve, reject) => {
//   const contract = getDepositoryContract(
//     window.MODAL_PROVIDER,
//     chainId,
//   );

//   const fn = contract.methods.redeem(bondIds).send({ from: account });

//   sendTransaction(fn, account)
//     .then((response) => resolve(response?.transactionHash))
//     .catch((e) => {
//       window.console.log('Error occured on depositing');
//       reject(e);
//     });
// });

/**
 *
 * DONATE Page
 * Donate to service
 * - Make sure the exists before deposit - check it using `exists` method
 *
 * INCENTIVES Page
 * - Add a button, take "SERVICE ID" as input & ouput "AGENT IDs" and "COMPONENT IDs"
 * - Get the agentIds and componentIds of the service using
 * getUnitIdsOfService(IRegistry.UnitType unitType, uint256 serviceId) - ServiceRegistry
 *
 *
 * bonding functionalities (depository and tokenomics contract)
 *
 * claim
 * - Make sure the user is the owner of the unit Id before checking/fetching the incentives
 *
 * DEPOSIT function
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
 */
