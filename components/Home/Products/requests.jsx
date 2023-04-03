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
      .then((list) => {
        console.log('list', list);
        resolve(list);
      })
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
            key: index,
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

/**
 * fetches product list based on the active/inactive status
 */
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

export const hasSufficientTokenRequest = ({
  account,
  chainId,
  token: productToken,
  tokenAmount,
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
      // if allowance is greater than or equal to token amount
      // then user has sufficient token
      const hasEnoughAllowance = ethers.BigNumber.from(response).gte(
        ethers.BigNumber.from(tokenAmount),
      );
      resolve(hasEnoughAllowance);
    })
    .catch((e) => {
      window.console.log(
        `Error occured on fetching allowance for the product token ${productToken}`,
      );
      reject(e);
    });
});

/**
 * Approves the treasury contract to spend the token
 */
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
      window.console.log('Error occured on approving OLAS');
      reject(e);
    });
});

/**
 * Deposits the token
 */
export const depositRequest = ({
  account, chainId, productId, tokenAmount,
}) => new Promise((resolve, reject) => {
  const contract = getDepositoryContract(window.MODAL_PROVIDER, chainId);

  const fn = contract.methods
    .deposit(productId, tokenAmount)
    .send({ from: account });

  sendTransaction(fn, account)
    .then((response) => {
      resolve(response?.transactionHash);
    })
    .catch((e) => {
      window.console.log('Error occured on depositing');
      reject(e);
    });
});

/**
 * In product add one more column - "Vesting"
 *
 * const abc = get the blockTimeStamp of the current product created
 *             (eg if 5th product is created then get the blockTimeStamp of 5th product)
 * const vesting = expiry - abc
 *
 */

// Send video to Mariapia
/**
 * 1. restart the docker
 * 2. move_time to next day (1 day)
 * 3. create a bond
 * 4. go before one day product expiers - move_time
 * 5. create a bond
 * 6. one day later - If both bond can be redeemed?
 * 7. If not - move_time untill both bond can be redeemed & trace the time I went on
 */
