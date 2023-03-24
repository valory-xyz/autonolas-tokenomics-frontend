import { ethers } from 'ethers';
import { sendTransaction } from '@autonolas/frontend-library';
import { MAX_AMOUNT, ADDRESS_ZERO, ONE_ETH } from 'common-util/functions';
import {
  getContractAddress,
  getDepositoryContract,
  getUniswapV2PairContract,
  getTokenomicsContract,
} from 'common-util/Contracts';

/**
 * fetches the IDF (discount factor) for the product
 *
 */
const getLastIDFRequest = ({ chainId }) => new Promise((resolve, reject) => {
  const contract = getTokenomicsContract(window.MODAL_PROVIDER, chainId);

  contract.methods
    .getLastIDF()
    .call()
    .then((lastIdfResponse) => {
      /**
         * 1 ETH = 1e18
         * discount = (1 ETH - lastIDF) / 1 ETH
         */
      const discount = ethers.BigNumber.from(ONE_ETH)
        .sub(lastIdfResponse)
        .div(ONE_ETH)
        .mul(100) // to convert it to percentage
        .toString();

      resolve(discount);
    })
    .catch((e) => {
      window.console.log('Error occured on getting last IDF');
      reject(e);
    });
});

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
    .then(async (productsList) => {
      const allListPromise = [];

      for (let i = 0; i < productsList; i += 1) {
        const id = `${i}`;
        const result = contract.methods.mapBondProducts(id).call();
        allListPromise.push(result);
      }

      // discount factor is same for all the products
      const discount = await getLastIDFRequest({ chainId });

      Promise.all(allListPromise)
        .then((response) => {
          // add id & discount to the product
          const productWithIds = response.map((product, index) => ({
            ...product,
            discount,
            id: index,
          }));

          // filter out the products that are removed
          const filteredList = productWithIds.filter(
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

    // discount factor is same for all the products
    const discount = await getLastIDFRequest({ chainId });

    const productList = response.map((product, index) => ({
      id: productIdList[index],
      key: productIdList[index],
      discount,
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
 * - Add a button similar to https://app.olympusdao.finance/?_gl=1*1hlr8kb*_ga*Njc2NTQ5OTI5LjE2NDY2NTI2OTQ.*_ga_QV7HNEEHV9*MTY3MjY3MDc5MS43LjAuMTY3MjY3MDc5MS4wLjAuMA..#/bonds/inverse
 *
 * - Token.approve() of
 * 1st arg - treasury address
 * 2nd arg - MAX_UINT256
 *
 *
 * getLastIDF calculation
 * const lastIDF = await tokenomics.getLastIDF(); // IN ETH and should be >= 1
 * const discount = (lastIDF - 1e18) / 10^16 // 1e18 is 1 ETH Value
 * // right now last IDF in 1 so answer is 0
 */
