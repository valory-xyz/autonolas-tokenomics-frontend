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
    .then((response) => {
      resolve(response);
    })
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
      const values = {
        pendingRelativeReward:
            unitType === '0'
              ? (parseToEth(response.pendingRelativeReward) * 17) / 100
              : (parseToEth(response.pendingRelativeReward) * 83) / 100,
        pendingRelativeTopUp:
            unitType === '0'
              ? (parseToEth(response.pendingRelativeTopUp) * 9) / 100
              : (parseToEth(response.pendingRelativeTopUp) * 41) / 100,
        id: '0',
        key: '0',
      };
      resolve(values);
    })
    .catch((e) => {
      window.console.log('Error occured on fetching map unit incentives');
      reject(e);
    });
});

export const checkpointRequest = ({ account, chainId }) => new Promise((resolve, reject) => {
  const contract = getTokenomicsContract(window.MODAL_PROVIDER, chainId);

  contract.methods
    .checkpoint()
    .send({ from: account })
    .then((response) => {
      // console.log('checkpoint response', response);
      resolve(response);
    })
    .catch((e) => {
      window.console.log('Error occured on checkpoint');
      reject(e);
    });
});

// function to fetch the last event from the tokenomics contract
export const getLastEventRequest = ({ chainId }) => new Promise((resolve, reject) => {
  const contract = getTokenomicsContract(window.MODAL_PROVIDER, chainId);
  console.log(contract);

  contract.getPastEvents(
    'allEvents',
    {
      fromBlock: 0,
      toBlock: 'latest',
    },
    (error, events) => {
      if (error) {
        reject(error);
      } else {
        resolve(events[events.length - 1]);
      }
    },
  );
});

// function to fetch the epoch length from the tokenomics contract
export const getEpochLength = ({ chainId }) => new Promise((resolve, reject) => {
  const contract = getTokenomicsContract(window.MODAL_PROVIDER, chainId);

  contract.methods

    .epochLen()
    .call()
    .then((response) => {
      resolve(response);
    })
    .catch((e) => {
      window.console.log('Error occured on fetching epoch');
      reject(e);
    });
});

// TODO: pendingRelativeReward - to be fixed
export const canShowCheckpoint = async ({ chainId, pendingRelativeReward }) => {
  try {
    const lastEvent = await getLastEventRequest({ chainId });
    const epochLen = await getEpochLength({ chainId });

    console.log(lastEvent);
    const itc = lastEvent; // TODO: what is this?
    const todayDateInSec = Math.floor(Date.now() / 1000);

    if (itc - todayDateInSec >= epochLen && pendingRelativeReward >= 0) {
      return true;
    }
    return false;
  } catch (error) {
    console.error(error);
  }

  return false;
};
