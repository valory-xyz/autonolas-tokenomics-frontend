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

const getBondingProgramsRequest = ({ chainId, isActive }) => new Promise((resolve, reject) => {
  const contract = getDepositoryContract(window.MODAL_PROVIDER, chainId);

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
    const productIdList = await getBondingProgramsRequest({
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
 * call uniswap token0 - line 164
 * - If token0 = OLAS then print "OLAS" +
 *   call name() from the ABI of ERC20 token with address token1
 * - else call name() from the ABI of ERC20 token
 * - else
 */

// export const getTokenName = ({
//   account,
//   chainId,
//   productId,
//   tokenAmount,
//   token = '0x073240f818dd606032956F709110656764008f58',
// }) => new Promise((resolve, reject) => {
//   const contract = getUniswapV2PairContract(window.MODAL_PROVIDER, token);

//   contract.methods
//     .token0()
//     .call()
//     .then((response) => {
//       console.log(response);
//     })
//     .catch((e) => {
//       window.console.log('Error occured on token');
//       reject(e);
//     });
// });

// export const getTokenName = async ({ chainId, token }) => {

// const token0 = await contract.methods.token0().call();

// if (token0 === getContractAddress('olas', chainId)) {
//   const token1 = await contract.methods.token1().call();
//   const token1Contract = getERC20Contract(window.MODAL_PROVIDER, token1);
//   const token1Name = await token1Contract.methods.name().call();
//   return `OLAS ${token1Name}`;
// }

// const tokenContract = getERC20Contract(window.MODAL_PROVIDER, token0);
// const tokenName = await tokenContract.methods.name().call();
// return tokenName;
// };
