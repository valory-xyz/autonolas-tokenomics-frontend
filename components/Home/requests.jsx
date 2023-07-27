/* eslint-disable max-len */
import { sendTransaction } from '@autonolas/frontend-library';
import { getDepositoryContract } from 'common-util/Contracts';

export const getBondInfoRequest = async (bondList) => {
  const contract = getDepositoryContract();

  try {
    const bondListPromise = [];

    for (let i = 0; i < bondList.length; i += 1) {
      const result = contract.methods.mapUserBonds(bondList[i].bondId).call();
      bondListPromise.push(result);
    }

    const lpTokenNameList = await Promise.all(bondListPromise);

    return bondList.map((component, index) => ({
      ...component,
      maturityDate: lpTokenNameList[index].maturity * 1000,
    }));
  } catch (error) {
    window.console.log('Error on fetching bond info');
    return bondList;
  }
};

/**
 * Bonding functionalities
 */
export const getBondsRequest = ({ account, isActive: isBondMatured }) => new Promise((resolve, reject) => {
  const contract = getDepositoryContract();

  console.log({ account, isBondMatured });

  contract.methods
    .getBonds(account, isBondMatured)
    .call()
    .then(async (response) => {
      console.log({ response });
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
        .then(async (allListResponse) => {
          const bondsListWithDetails = allListResponse.map((bond, index) => ({
            ...bond,
            bondId: idsList[index],
            key: idsList[index],
          }));

          console.log({ bondsListWithDetails });

          const bondsWithMaturityDate = await getBondInfoRequest(
            bondsListWithDetails,
          );

          console.log({ bondsWithMaturityDate });

          resolve(bondsWithMaturityDate);
        })
        .catch((e) => reject(e));
    })
    .catch((e) => {
      window.console.log('Error on fetching bonds');
      reject(e);
    });
});

export const redeemRequest = ({ account, bondIds }) => new Promise((resolve, reject) => {
  const contract = getDepositoryContract();

  const fn = contract.methods.redeem(bondIds).send({ from: account });

  sendTransaction(fn, account)
    .then((response) => resolve(response?.transactionHash))
    .catch((e) => {
      window.console.log(`Error occured on redeeming bonds: ${bondIds}`);
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
