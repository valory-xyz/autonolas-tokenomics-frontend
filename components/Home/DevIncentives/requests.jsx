import { sendTransaction } from '@autonolas/frontend-library';
import { UNIT_TYPES } from 'util/constants';
import { getBlockTimestamp, parseToEth } from 'common-util/functions';
import {
  getDispenserContract,
  getTokenomicsContract,
  getTreasuryContract,
  getAgentContract,
  getComponentContract,
} from 'common-util/Contracts';

/**
 * fetches the owners of the units
 */
export const getOwnersForUnits = ({ unitIds, unitTypes }) => new Promise((resolve, reject) => {
  const ownersList = [];

  const agentContract = getAgentContract();
  const componentContract = getComponentContract();

  for (let i = 0; i < unitIds.length; i += 1) {
    // 1 = agent, 0 = component
    if (unitTypes[i] === UNIT_TYPES.AGENT) {
      const result = agentContract.methods.ownerOf(unitIds[i]).call();
      ownersList.push(result);
    } else {
      const result = componentContract.methods.ownerOf(unitIds[i]).call();
      ownersList.push(result);
    }
  }

  Promise.all(ownersList)
    .then(async (list) => {
      const results = await Promise.all(list.map((e) => e));
      resolve(results);
    })
    .catch((e) => {
      reject(e);
    });
});

export const getOwnerIncentivesRequest = ({
  address,
  chainId,
  unitTypes,
  unitIds,
}) => new Promise((resolve, reject) => {
  const contract = getTokenomicsContract(window.MODAL_PROVIDER, chainId);

  contract.methods
    .getOwnerIncentives(address, unitTypes, unitIds)
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

export const checkpointRequest = ({ account, chainId }) => new Promise((resolve, reject) => {
  const contract = getTokenomicsContract(window.MODAL_PROVIDER, chainId);

  const fn = contract.methods.checkpoint().send({ from: account });

  sendTransaction(fn, account)
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

const getUnitPointReq = ({ lastPoint, chainId, num }) => new Promise((resolve, reject) => {
  const contract = getTokenomicsContract(window.MODAL_PROVIDER, chainId);

  contract.methods
    .getUnitPoint(lastPoint, num)
    .call()
    .then((response) => {
      resolve(response);
    })
    .catch((e) => {
      window.console.log('Error occured on fetching epoch');
      reject(e);
    });
});

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
    .then(async (response) => {
      const currentEpochCounter = await getEpochCounter({ chainId });

      // Get the unit points of the last epoch
      const componentInfo = await getUnitPointReq({
        lastPoint: currentEpochCounter,
        num: 0,
        chainId,
      });

      const agentInfo = await getUnitPointReq({
        lastPoint: currentEpochCounter,
        num: 1,
        chainId,
      });

      const { pendingRelativeReward, pendingRelativeTopUp, lastEpoch } = response;

      // if the current epoch is the last epoch, calculate the incentives
      if (currentEpochCounter === lastEpoch) {
        const {
          rewardUnitFraction: aRewardFraction,
          topUpUnitFraction: aTopupFraction,
        } = agentInfo;
        const {
          rewardUnitFraction: cRewardFraction,
          topUpUnitFraction: cTopupFraction,
        } = componentInfo;

        /**
           * for unitType agent(0) & component(1),
           * the below formula is used to calculate the incentives
           */
        const componentPendingReward = (parseToEth(pendingRelativeReward) * cRewardFraction) / 100;
        const agentPendingReward = (parseToEth(pendingRelativeReward) * aRewardFraction) / 100;
        const componentPendingTopUp = (parseToEth(pendingRelativeTopUp) * cTopupFraction) / 100;
        const agentPendingTopUp = (parseToEth(pendingRelativeTopUp) * aTopupFraction) / 100;

        resolve({
          pendingRelativeReward:
              unitType === UNIT_TYPES.COMPONENT
                ? componentPendingReward
                : agentPendingReward,
          pendingRelativeTopUp:
              unitType === UNIT_TYPES.COMPONENT
                ? componentPendingTopUp
                : agentPendingTopUp,
          id: '0',
          key: '0',
        });
      } else {
        resolve({
          pendingRelativeReward: 0,
          pendingRelativeTopUp: 0,
          id: '0',
          key: '0',
        });
      }
    })
    .catch((e) => {
      window.console.log('Error occured on fetching map unit incentives');
      reject(e);
    });
});

export const getPausedValueRequest = ({ chainId }) => new Promise((resolve, reject) => {
  const contract = getTreasuryContract(window.MODAL_PROVIDER, chainId);

  contract.methods
    .paused()
    .call()
    .then((response) => {
      resolve(response);
    })
    .catch((e) => {
      window.console.log('Error occured on fetching is paused');
      reject(e);
    });
});
