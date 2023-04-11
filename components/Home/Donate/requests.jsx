import { sendTransaction } from '@autonolas/frontend-library';
import { parseToEth } from 'common-util/functions';
import {
  getTokenomicsContract,
  getTreasuryContract,
} from 'common-util/Contracts';

export const depositServiceDonationRequest = ({
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

export const getVeOlasThresholdRequest = ({ chainId }) => new Promise((resolve, reject) => {
  const contract = getTokenomicsContract(window.MODAL_PROVIDER, chainId);

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
