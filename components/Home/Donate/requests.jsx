import { sendTransaction } from '@autonolas/frontend-library';
import { parseToEth, notifyError } from 'common-util/functions';
import {
  getTokenomicsContract,
  getTreasuryContract,
  getServiceContract,
} from 'common-util/Contracts';

export const getServiceDetails = (id) => new Promise((resolve, reject) => {
  const contract = getServiceContract();

  contract.methods
    .getService(id)
    .call()
    .then(async (response) => {
      resolve(response);
    })
    .catch((e) => {
      reject(e);
    });
});

export const checkServicesNotTerminatedOrNotDeployed = (ids) => new Promise((resolve, reject) => {
  const allServiceDetailsPromise = ids.map((id) => getServiceDetails(id));

  Promise.all(allServiceDetailsPromise)
    .then((allServiceDetails) => {
      const invalidServiceIds = [];
      allServiceDetails.forEach((service, index) => {
        if (service.state !== '4' && service.state !== '5') {
          invalidServiceIds.push(ids[index]);
        }
      });

      if (invalidServiceIds.length === 0) {
        resolve([]);
      } else {
        notifyError(
          'Provided service IDs are not deployed or terminated:',
          invalidServiceIds.join(', '),
        );
        reject(
          new Error('Provided service IDs are not deployed or terminated'),
        );
      }
    })
    .catch((e) => {
      reject(e);
    });
});

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
