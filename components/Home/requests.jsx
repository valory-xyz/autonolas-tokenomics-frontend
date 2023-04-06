import { sendTransaction } from '@autonolas/frontend-library';
import { getDepositoryContract } from 'common-util/Contracts';

/**
 * Bonding functionalities
 */
export const getBondsRequest = ({
  account,
  chainId,
  isActive: isBondMatured,
}) => new Promise((resolve, reject) => {
  const contract = getDepositoryContract(window.MODAL_PROVIDER, chainId);

  contract.methods
    .getBonds(account, isBondMatured)
    .call()
    .then(async (response) => {
      const { bondIds } = response;
      const allListPromise = [];
      const idsList = [];

      for (let i = 0; i < bondIds.length; i += 1) {
        const id = `${bondIds[i]}`;
        const result = contract.methods.getBondStatus(id).call();
        allListPromise.push(result);
        idsList.push(id);
      }

      Promise.all(allListPromise)
        .then((allListResponse) => {
          const bondsListWithDetails = allListResponse.map((bond, index) => ({
            ...bond,
            bondId: idsList[index],
            key: idsList[index],
          }));

          resolve(bondsListWithDetails);
        })
        .catch((e) => reject(e));
    })
    .catch((e) => {
      window.console.log('Error on fetching bonds');
      reject(e);
    });
});

export const redeemRequest = ({ account, chainId, bondIds }) => new Promise((resolve, reject) => {
  const contract = getDepositoryContract(window.MODAL_PROVIDER, chainId);

  const fn = contract.methods.redeem(bondIds).send({ from: account });

  sendTransaction(fn, account)
    .then((response) => resolve(response?.transactionHash))
    .catch((e) => {
      window.console.log('Error occured on redeeming bonds: ', bondIds);
      reject(e);
    });
});

/**
 *
 * DONATE Page
 * Donate to service
 * - Make sure the exists before deposit - check it using `exists` method
 *
 * INCENTIVES Page
 * - Add a button, take "SERVICE ID" as input & ouput "AGENT IDs" and "COMPONENT IDs"
 * - Get the agentIds and componentIds of the service using
 * getUnitIdsOfService(IRegistry.UnitType unitType, uint256 serviceId) - ServiceRegistry
 *
 * CLAIM
 * - Make sure the user is the owner of the unit Id before checking/fetching the incentives
 *
 */
