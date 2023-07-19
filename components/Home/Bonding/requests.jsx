/* eslint-disable max-len */
import { ethers } from 'ethers';
import { sendTransaction } from '@autonolas/frontend-library';
import { OLAS_ADDRESS } from 'util/constants';
import { MAX_AMOUNT, ADDRESS_ZERO, ONE_ETH } from 'common-util/functions';
import {
  getContractAddress,
  getDepositoryContract,
  getUniswapV2PairContract,
  getTokenomicsContract,
  getErc20Contract,
} from 'common-util/Contracts';

/**
 * fetches the IDF (discount factor) for the product
 */
const getLastIDFRequest = () => new Promise((resolve, reject) => {
  const contract = getTokenomicsContract();

  contract.methods
    .getLastIDF()
    .call()
    .then((lastIdfResponse) => {
      /**
         * 1 ETH = 1e18
         * discount = (lastIDF - 1 ETH) / 1 ETH
         */
      const firstDiv = Number(lastIdfResponse) - Number(ONE_ETH);
      const discount = ((firstDiv * 1.0) / Number(ONE_ETH)) * 100;
      resolve(discount);
    })
    .catch((e) => {
      window.console.log('Error occured on getting last IDF');
      reject(e);
    });
});

const getBondingProgramsRequest = ({ isActive }) => new Promise((resolve, reject) => {
  const contract = getDepositoryContract();

  contract.methods
    .getProducts(isActive)
    .call()
    .then((response) => {
      resolve(response);
    })
    .catch((e) => {
      window.console.log('Error on fetching the list');
      reject(e);
    });
});

/**
 * fetches the lp token name for the product
 * @example
 * input: '0x'
 * output: 'OLAS-ETH'
 */
export const getLpTokenName = async (address) => {
  try {
    const contract = getUniswapV2PairContract(address);

    let token0 = await contract.methods.token0().call();
    const token1 = await contract.methods.token1().call();

    if (token0 === OLAS_ADDRESS) {
      token0 = token1;
    }

    const erc20Contract = getErc20Contract(token0);
    const tokenSymbol = await erc20Contract.methods.symbol().call();

    return `OLAS-${tokenSymbol}`;
  } catch (error) {
    window.console.log('Error on fetching lp token name');
    return null;
  }
};

/**
 * fetches the lp token name for the product
 * @example
 * input: [{ token: '0x', ...others }]
 * output: [{ token: '0x', lpTokenName: 'OLAS-ETH', ...others }]
 */
const getLpTokenNamesForProducts = async (productList) => {
  const lpTokenNamePromiseList = [];

  for (let i = 0; i < productList.length; i += 1) {
    const result = getLpTokenName(productList[i].token);
    lpTokenNamePromiseList.push(result);
  }

  const lpTokenNameList = await Promise.all(lpTokenNamePromiseList);

  return productList.map((component, index) => ({
    ...component,
    lpTokenName: lpTokenNameList[index],
  }));
};

/**
 *
 */
const getProductDetailsFromIds = ({ productIdList }) => new Promise((resolve, reject) => {
  const contract = getDepositoryContract();

  try {
    const allListPromise = [];

    for (let i = 0; i < productIdList.length; i += 1) {
      const id = productIdList[i];
      const result = contract.methods.mapBondProducts(id).call();
      allListPromise.push(result);
    }

    Promise.all(allListPromise)
      .then(async (productList) => {
        const list = await getLpTokenNamesForProducts(productList);
        resolve(list);
      })
      .catch((e) => reject(e));
  } catch (error) {
    window.console.log('Error on fetching bonding program details details');
    reject(error);
  }
});

/**
 * returns all the products that are not removed
 * ie. 1. active products,
 *     2. inactive products,
 *     3. 0 supply + active + inactive (combination of 1, 2, 3)
 */
export const getAllTheProductsNotRemoved = async () => new Promise((resolve, reject) => {
  const contract = getDepositoryContract();
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
      const discount = await getLastIDFRequest();

      Promise.all(allListPromise)
        .then(async (response) => {
          // add id & discount to the product
          const productWithIds = response.map((product, index) => ({
            ...product,
            discount,
            id: index,
            key: index,
          }));

          const productsWithLpTokens = await getLpTokenNamesForProducts(
            productWithIds,
          );

          // filter out the products that are removed
          const filteredList = productsWithLpTokens.filter(
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
export const getProductListRequest = async ({ isActive }) => {
  try {
    const productIdList = await getBondingProgramsRequest({ isActive });

    const response = await getProductDetailsFromIds({ productIdList });

    // discount factor is same for all the products
    const discount = await getLastIDFRequest();

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
  const contract = getUniswapV2PairContract(productToken);

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
  const contract = getUniswapV2PairContract(token);

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
export const depositRequest = ({ account, productId, tokenAmount }) => new Promise((resolve, reject) => {
  const contract = getDepositoryContract();

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

export const getLpBalanceRequest = ({ account, token }) => new Promise((resolve, reject) => {
  const contract = getUniswapV2PairContract(token);

  contract.methods
    .balanceOf(account)
    .call()
    .then((response) => {
      resolve(Number(response));
    })
    .catch((e) => {
      window.console.log('Error occured on fetching LP balance');
      reject(e);
    });
});
