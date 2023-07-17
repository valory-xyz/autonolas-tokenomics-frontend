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

export const minAcceptedEthRequest = ({ chainId }) => new Promise((resolve, reject) => {
  const contract = getTreasuryContract(window.MODAL_PROVIDER, chainId);

  contract.methods
    .minAcceptedETH()
    .call()
    .then((response) => resolve(response))
    .catch((e) => {
      window.console.log('Error occured on fetching min accepted ETH');
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

// export const getLastEpochRequest = ({ chainId }) => new Promise((resolve, reject) => {
//   const contract = getTokenomicsContract(window.MODAL_PROVIDER, chainId);

//   // const lastEpochCounter = await tokenomics.epochCounter() - 1;
//   // const prevEpochPoint = await tokenomics.mapEpochTokenomics(lastEpochCounter);
//   // const prevEpochEndTime = prevEpochPoint.endTime;
//   // const epochLen = await tokenomics.epocLen();
//   // const nextEpochEndTime = prevEpochEndTime + epochLen;

//   const epCounter = await getEpochCounter({ chainId });

//   contract.methods
//     .lastEpoch()
//     .call()
//     .then((response) => resolve(response))
//     .catch((e) => {
//       window.console.log('Error occured on fetching last epoch');
//       reject(e);
//     });
// });
