/* eslint-disable max-len */
// import { ethers } from 'ethers';
import { sendTransaction } from '@autonolas/frontend-library';
// import { MAX_AMOUNT, parseEther } from 'common-util/functions';
import { getDepositoryContract } from 'common-util/Contracts';

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

// export const getDepositoryContractRequest = ({
//   account,
//   chainId,
//   unitTypes,
//   unitIds,
// }) => new Promise((resolve, reject) => {
//   const contract = getDepositoryContract(window.MODAL_PROVIDER, chainId);

//   const fn = contract.methods
//     .depositServiceDonationsETH(account, unitTypes, unitIds)
//     .send({ from: account });

//   sendTransaction(fn, account)
//     .then((response) => resolve(response?.transactionHash))
//     .catch((e) => {
//       window.console.log('Error occured on increasing amount');
//       reject(e);
//     });
// });
