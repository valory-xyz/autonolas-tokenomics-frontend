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
const getLastBlockTimestamp = ({ chainId }) => new Promise((resolve, reject) => {
  const contract = getTokenomicsContract(window.MODAL_PROVIDER, chainId);

  contract.getPastEvents(
    'EpochSettled',
    {
      fromBlock: 0,
      toBlock: 'latest',
    },
    (error, events) => {
      if (error) {
        reject(error);
      } else {
        const lastBlock = events[events.length - 1].blockNumber;
        console.log({ events });
        window.WEB3_PROVIDER.eth.getBlock(lastBlock, (e, block) => {
          if (e) {
            reject(e);
          } else {
            console.log({ block });
            resolve(block.timestamp);
          }
        });
      }
    },
  );
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
    const lastBlockTs = await getLastBlockTimestamp({ chainId });
    const epochLen = await getEpochLength({ chainId });
    const todayDateInSec = Math.floor(Date.now() / 1000);

    console.log({
      lastBlockTs,
      todayDateInSec,
      epochLen,
      lastBlockTsInDate: new Date(lastBlockTs * 1000),
      todayDateInSecInDate: new Date(todayDateInSec * 1000),
      multipiedBy2: (todayDateInSec + (epochLen * 2)),
      minus1: (todayDateInSec + (epochLen * 2)) - lastBlockTs,
      minus2: (todayDateInSec + (epochLen * 2)) - lastBlockTs >= epochLen,
    });

    // To check locally, add epochLen to todayDateInSec
    // ie. (todayDateInSec + epochLen) instead of just todayDateInSec
    if ((todayDateInSec + (epochLen * 2)) - lastBlockTs >= epochLen) {
      return true;
    }
    return false;
  } catch (error) {
    console.error(error);
  }

  return false;
};
