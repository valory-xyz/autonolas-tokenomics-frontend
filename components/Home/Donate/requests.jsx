import { sendTransaction } from '@autonolas/frontend-library';
import { parseToEth } from 'common-util/functions';
import {
  getTokenomicsContract,
  getTreasuryContract,
} from 'common-util/Contracts';

export const depositServiceDonationRequest = ({
  account,
  serviceIds,
  amounts,
  totalAmount,
}) => new Promise((resolve, reject) => {
  const contract = getTreasuryContract();

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

export const minAcceptedEthRequest = () => new Promise((resolve, reject) => {
  const contract = getTreasuryContract();

  contract.methods
    .minAcceptedETH()
    .call()
    .then((response) => resolve(response))
    .catch((e) => {
      window.console.log('Error occured on fetching min accepted ETH');
      reject(e);
    });
});

export const getVeOlasThresholdRequest = () => new Promise((resolve, reject) => {
  const contract = getTokenomicsContract();

  contract.methods
    .veOLASThreshold()
    .call()
    .then((response) => {
      resolve(parseToEth(response));
    })
    .catch((e) => {
      window.console.log('Error occured on fetching veOLAS threshold');
      reject(e);
    });
});
