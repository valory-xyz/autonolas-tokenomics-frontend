import { sendTransaction } from '@autonolas/frontend-library';
import { parseToEth } from 'common-util/functions';
import {
  getDispenserContract,
  getTokenomicsContract,
} from 'common-util/Contracts';

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
      resolve(response?.transactionHash);
    })
    .catch((e) => {
      window.console.log('Error occured on claiming incentives');
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
