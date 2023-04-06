import { sendTransaction } from '@autonolas/frontend-library';
import {
  getTokenomicsContract,
  getTreasuryContract,
} from 'common-util/Contracts';

export const getDepositoryContractRequest = ({
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
  codeId,
}) => new Promise((resolve, reject) => {
  const contract = getTokenomicsContract(window.MODAL_PROVIDER, chainId);

  contract.methods
    .mapUnitIncentives(unitType, codeId)
    .call()
    .then((response) => {
      resolve(response);
    })
    .catch((e) => {
      window.console.log('Error occured on fetching mmap unit incentives');
      reject(e);
    });
});
