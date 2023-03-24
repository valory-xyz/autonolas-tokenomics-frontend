import { ethers } from 'ethers';
import { sendTransaction } from '@autonolas/frontend-library';
import { MAX_AMOUNT, ADDRESS_ZERO } from 'common-util/functions';
import {
  getContractAddress,
  getDepositoryContract,
  getUniswapV2PairContract,
} from 'common-util/Contracts';

const getProductsRequest = ({ chainId, isActive }) => new Promise((resolve, reject) => {
  const contract = getDepositoryContract(window.MODAL_PROVIDER, chainId);

  contract.methods
    .getProducts(isActive)
    .call()
    .then((response) => {
      resolve(response);
    })
    .catch((e) => {
      window.console.log('Error on fetching product ID list');
      reject(e);
    });
});

/**
 *
 */
const getProductDetailsFromIds = ({ chainId, productIdList }) => new Promise((resolve, reject) => {
  const contract = getDepositoryContract(window.MODAL_PROVIDER, chainId);

  try {
    const allListPromise = [];

    for (let i = 0; i < productIdList.length; i += 1) {
      const id = productIdList[i];
      const result = contract.methods.mapBondProducts(id).call();
      allListPromise.push(result);
    }

    Promise.all(allListPromise)
      .then((componentsList) => resolve(componentsList))
      .catch((e) => reject(e));
  } catch (error) {
    window.console.log('Error on fetching products details');
    reject(error);
  }
});

/**
 * returns all the products that are not removed
 * ie. 1. active products,
 *     2. inactive products,
 *     3. 0 supply + active + inactive (combination of 1, 2, 3)
 */
export const getAllTheProductsNotRemoved = async ({ chainId }) => new Promise((resolve, reject) => {
  const contract = getDepositoryContract(window.MODAL_PROVIDER, chainId);
  contract.methods
    .productCounter()
    .call()
    .then((productsList) => {
      const allListPromise = [];

      for (let i = 0; i < productsList; i += 1) {
        const id = `${i}`;
        const result = contract.methods.mapBondProducts(id).call();
        allListPromise.push(result);
      }

      Promise.all(allListPromise)
        .then((response) => {
          // filter out the products that are removed
          const filteredList = response.filter(
            (product) => product.token !== ADDRESS_ZERO,
          );
          resolve(filteredList);
        })
        .catch((e) => reject(e));
    })
    .catch((e) => {
      window.console.log('Error on fetching products');
      reject(e);
    });

  // const numAllProducts = await depository.productCounter();
  // for (let i = 0; i < numAllProducts) {
  //     const product = await depository.mapBondProducts(i);
  //     if (product.token != AddressZero) {
  //          output the product info
  //     }
  // }
});

export const getProductListRequest = async ({ account, chainId, isActive }) => {
  try {
    const productIdList = await getProductsRequest({
      account,
      chainId,
      isActive,
    });

    const response = await getProductDetailsFromIds({
      productIdList,
      chainId,
    });

    const productList = response.map((product, index) => ({
      id: productIdList[index],
      key: productIdList[index],
      ...product,
    }));

    return productList;
  } catch (error) {
    throw new Error(error);
  }
};

export const depositRequest = ({
  account, chainId, productId, tokenAmount,
}) => new Promise((resolve, reject) => {
  const contract = getDepositoryContract(window.MODAL_PROVIDER, chainId);

  const fn = contract.methods
    .deposit(productId, tokenAmount)
    .send({ from: account });

  sendTransaction(fn, account)
    .then((response) => {
      console.log(response);
      resolve(response?.transactionHash);
    })
    .catch((e) => {
      window.console.log('Error occured on depositing');
      reject(e);
    });
});

export const hasSufficientTokenRequest = ({
  account,
  chainId,
  token: productToken,
}) => new Promise((resolve, reject) => {
  const contract = getUniswapV2PairContract(
    window.MODAL_PROVIDER,
    productToken,
  );

  const treasuryAddress = getContractAddress('treasury', chainId);

  contract.methods
    .allowance(account, treasuryAddress)
    .call()
    .then((response) => {
      console.log({ allowance: response });
      // check if the allowance is equal to MAX_AMOUNT
      resolve(ethers.BigNumber.from(response).eq(MAX_AMOUNT));
    })
    .catch((e) => {
      window.console.log('Error occured on calling `allowance` method');
      reject(e);
    });
});

export const approveRequest = ({ account, chainId, token }) => new Promise((resolve, reject) => {
  const contract = getUniswapV2PairContract(window.MODAL_PROVIDER, token);

  const treasuryAddress = getContractAddress('treasury', chainId);

  const fn = contract.methods
    .approve(treasuryAddress, MAX_AMOUNT)
    .send({ from: account });

  sendTransaction(fn, account)
    .then((response) => {
      resolve(response);
    })
    .catch((e) => {
      window.console.log('Error occured on approving OLAS by owner');
      reject(e);
    });
});

/**
 * Bonding functionalities
 */
// export const redeemRequest = ({ account, chainId, bondIds }) =>
// new Promise((resolve, reject) => {
//   const contract = getDepositoryContract(
//     window.MODAL_PROVIDER,
//     chainId,
//   );

//   const fn = contract.methods.redeem(bondIds).send({ from: account });

//   sendTransaction(fn, account)
//     .then((response) => resolve(response?.transactionHash))
//     .catch((e) => {
//       window.console.log('Error occured on depositing');
//       reject(e);
//     });
// });
