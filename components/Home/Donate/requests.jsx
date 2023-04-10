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

export const getMapUnitIncentivesRequest = ({
  // account,
  chainId,
  unitType,
  unitId,
}) => new Promise((resolve, reject) => {
  const contract = getTokenomicsContract(window.MODAL_PROVIDER, chainId);

  contract.methods
    .mapUnitIncentives(unitType, unitId)
    .call()
    .then((response) => {
      /**
         * for unitType agent(0) & component(1),
         * the below formula is used to calculate the incentives
         */
      const values = [
        {
          pendingRelativeReward:
              unitType === 0
                ? (parseToEth(response.pendingRelativeReward) * 17) / 100
                : (parseToEth(response.pendingRelativeReward) * 83) / 100,
          pendingRelativeTopUp:
              unitType === 0
                ? (parseToEth(response.pendingRelativeTopUp) * 9) / 100
                : (parseToEth(response.pendingRelativeTopUp) * 41) / 100,
          id: '0',
          key: '0',
        },
      ];
      resolve(values);
    })
    .catch((e) => {
      window.console.log('Error occured on fetching map unit incentives');
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
