import { ethers } from 'ethers';
import { sendTransaction } from '@autonolas/frontend-library';
import { MAX_AMOUNT } from 'common-util/functions';
import {
  // getContractAddress,
  getDepositoryContract,
  getDispenserContract,
  getTokenomicsContract,
  getTreasuryContract,
  getUniswapV2PairContract,
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

export const getProductsRequest = ({ chainId, isActive }) => new Promise((resolve, reject) => {
  const contract = getDepositoryContract(window.MODAL_PROVIDER, chainId);

  console.log({ isActive });

  contract.methods
    .getProducts(isActive)
    .call()
    .then((response) => {
      console.log({ response });
      resolve(response);
    })
    .catch((e) => {
      window.console.log('Error on fetching products');
      reject(e);
    });
});

export const getProductDetailsFromIdsRequest = ({
  chainId,
  productIdList = [],
}) => new Promise((resolve, reject) => {
  const contract = getDepositoryContract(window.MODAL_PROVIDER, chainId);

  try {
    const allListPromise = [];

    for (let i = 0; i < productIdList.length; i += 1) {
      const id = productIdList[i];
      const result = contract.methods.mapBondProducts(id).call();
      allListPromise.push(result);
    }

    Promise.all(allListPromise)
      .then((componentsList) => resolve(componentsList))
      .catch((e) => reject(e));
  } catch (error) {
    window.console.log('Error on fetching products');
    reject(error);
  }
});

export const depositRequest = ({
  account, chainId, productId, tokenAmount,
}) => new Promise((resolve, reject) => {
  const contract = getDepositoryContract(window.MODAL_PROVIDER, chainId);

  const fn = contract.methods
    .deposit(productId, tokenAmount)
    .send({ from: account });

  sendTransaction(fn, account)
    .then((response) => {
      console.log(response);
      resolve(response?.transactionHash);
    })
    .catch((e) => {
      window.console.log('Error occured on depositing');
      reject(e);
    });
});

export const hasSufficientTokenRequest = ({
  account,
  // chainId,
  token: productToken,
}) => new Promise((resolve, reject) => {
  const contract = getUniswapV2PairContract(
    window.MODAL_PROVIDER,
    productToken,
  );

  // TODO: change it based on chain id
  const LOCAL_TREASURY_ADDRESS = '0x36C02dA8a0983159322a80FFE9F24b1acfF8B570';
  // const treasuryAddress = getContractAddress('treasury', chainId);

  contract.methods
    .allowance(account, LOCAL_TREASURY_ADDRESS)
    .call()
    .then((response) => {
      console.log({ allowance: response });
      // check if the allowance is equal to MAX_AMOUNT
      resolve(ethers.BigNumber.from(response).eq(MAX_AMOUNT));
    })
    .catch((e) => {
      window.console.log('Error occured on calling `allowance` method');
      reject(e);
    });
});

export const approveOlasByOwner = ({ account, token }) => new Promise((resolve, reject) => {
  const contract = getUniswapV2PairContract(window.MODAL_PROVIDER, token);

  // TODO: change it based on chain id
  const LOCAL_TREASURY_ADDRESS = '0x36C02dA8a0983159322a80FFE9F24b1acfF8B570';

  const fn = contract.methods
    .approve(LOCAL_TREASURY_ADDRESS, MAX_AMOUNT)
    .send({ from: account });

  sendTransaction(fn, account)
    .then((response) => {
      resolve(response);
    })
    .catch((e) => {
      window.console.log('Error occured on approving OLAS by owner');
      reject(e);
    });
});

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
