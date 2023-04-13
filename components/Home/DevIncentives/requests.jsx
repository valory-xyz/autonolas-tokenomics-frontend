import { sendTransaction } from '@autonolas/frontend-library';
import { getBlockTimestamp, parseToEth } from 'common-util/functions';
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
      resolve(response);
    })
    .catch((e) => {
      window.console.log('Error occured on checkpoint');
      reject(e);
    });
});

const getEpochCounter = ({ chainId }) => new Promise((resolve, reject) => {
  const contract = getTokenomicsContract(window.MODAL_PROVIDER, chainId);

  contract.methods
    .epochCounter()
    .call()
    .then((response) => {
      resolve(parseInt(response, 10));
    })
    .catch((e) => {
      window.console.log('Error occured on fetching epoch counter');
      reject(e);
    });
});

const getEpochTokenomics = ({ chainId, lastPoint }) => new Promise((resolve, reject) => {
  const contract = getTokenomicsContract(window.MODAL_PROVIDER, chainId);

  contract.methods
    .mapEpochTokenomics(lastPoint)
    .call()
    .then((response) => {
      resolve(response);
    })
    .catch((e) => {
      window.console.log('Error occured on fetching epoch tokenomics');
      reject(e);
    });
});

// function to fetch the epoch length from the tokenomics contract
const getEpochLength = ({ chainId }) => new Promise((resolve, reject) => {
  const contract = getTokenomicsContract(window.MODAL_PROVIDER, chainId);

  contract.methods
    .epochLen()
    .call()
    .then((response) => {
      resolve(parseInt(response, 10));
    })
    .catch((e) => {
      window.console.log('Error occured on fetching epoch');
      reject(e);
    });
});

export const canShowCheckpoint = async ({ chainId }) => {
  try {
    const epCounter = await getEpochCounter({ chainId });
    const epTokenomics = await getEpochTokenomics({
      lastPoint: Number(epCounter) - 1,
      chainId,
    });
    const epochLen = await getEpochLength({ chainId });
    const blockTimestamp = await getBlockTimestamp();
    const { endTime } = epTokenomics;

    if (blockTimestamp - endTime >= epochLen) {
      return true;
    }
    return false;
  } catch (error) {
    console.error(error);
  }

  return false;
};
