import Web3 from 'web3';
import {
  BUOLAS_ADDRESS_GOERLI,
  BUOLAS_ABI_GOERLI,
  BUOLAS_ADDRESS_MAINNET,
  BUOLAS_ABI_MAINNET,
} from 'common-util/AbiAndAddresses';
import { LOCAL_CHAIN_ID } from 'util/constants';

/**
 * Addresses fetched when backend connected locally
 * to hardhat from initDeploy.json
 */
export const LOCAL_ADDRESSES = {
  BUOLAS_ADDRESS_LOCAL: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
};

/**
 * Returns contract address based on type and chainId.
 * Right now, only 3 types are supported: olas, veOlas, buOlas
 * and 3 chains: local, goerli and mainnet.
 */
export const getContractAddress = (type, chainId) => {
  switch (type) {
    case 'buOlas':
    default: {
      if (chainId === LOCAL_CHAIN_ID) {
        return LOCAL_ADDRESSES.BUOLAS_ADDRESS_LOCAL;
      }
      if (chainId === 5) return BUOLAS_ADDRESS_GOERLI;
      return BUOLAS_ADDRESS_MAINNET;
    }
  }
};

export const getBuolasContract = (p, chainId) => {
  const web3 = new Web3(p);
  const contract = new web3.eth.Contract(
    chainId === 1 ? BUOLAS_ABI_MAINNET : BUOLAS_ABI_GOERLI,
    getContractAddress('buOlas', chainId),
  );
  return contract;
};
