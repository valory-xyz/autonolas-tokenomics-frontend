import Web3 from 'web3';
import {
  // depository
  DEPOSITORY_ADDRESS_MAINNET as DEPOSITORY_ADDRESS_GOERLI, // TODO: change to goerli address
  DEPOSITORY_ABI_MAINNET as DEPOSITORY_ABI_GOERLI, // TODO: change to goerli abi
  DEPOSITORY_ADDRESS_MAINNET,
  DEPOSITORY_ABI_MAINNET,

  // dispensers
  DISPENSER_ADDRESS_MAINNET as DISPENSER_ADDRESS_GOERLI, // TODO: change to goerli address
  DISPENSER_ABI_MAINNET as DISPENSER_ABI_GOERLI, // TODO: change to goerli abi
  DISPENSER_ADDRESS_MAINNET,
  DISPENSER_ABI_MAINNET,

  // treasury
  TREASURY_ADDRESS_MAINNET as TREASURY_ADDRESS_GOERLI, // TODO: change to goerli address
  TREASURY_ABI_MAINNET as TREASURY_ABI_GOERLI, // TODO: change to goerli abi
  TREASURY_ADDRESS_MAINNET,
  TREASURY_ABI_MAINNET,
} from 'common-util/AbiAndAddresses';
import { LOCAL_CHAIN_ID } from 'util/constants';

/**
 * Addresses fetched when backend connected locally
 * to hardhat from initDeploy.json
 */
export const LOCAL_ADDRESSES = {
  DEPOSITORY_ADDRESS_LOCAL: '',
  DISPENSER_ADDRESS_LOCAL: '',
  TREASURY_ADDRESS_LOCAL: '',
};

/**
 * Returns contract address based on type and chainId.
 */
export const getContractAddress = (type, chainId) => {
  switch (type) {
    case 'dispenser': {
      if (chainId === LOCAL_CHAIN_ID) {
        return LOCAL_ADDRESSES.DISPENSER_ADDRESS_LOCAL;
      }
      if (chainId === 5) return DISPENSER_ADDRESS_GOERLI;
      return DISPENSER_ADDRESS_MAINNET;
    }
    case 'depository': {
      if (chainId === LOCAL_CHAIN_ID) {
        return LOCAL_ADDRESSES.DEPOSITORY_ADDRESS_LOCAL;
      }
      if (chainId === 5) return DEPOSITORY_ADDRESS_GOERLI;
      return DEPOSITORY_ADDRESS_MAINNET;
    }
    case 'treasury': {
      if (chainId === LOCAL_CHAIN_ID) {
        return LOCAL_ADDRESSES.TREASURY_ADDRESS_LOCAL;
      }
      if (chainId === 5) return TREASURY_ADDRESS_GOERLI;
      return TREASURY_ADDRESS_MAINNET;
    }
    default:
      throw new Error('Invalid contract type');
  }
};

export const getDepositoryContract = (p, chainId) => {
  const web3 = new Web3(p);
  const contract = new web3.eth.Contract(
    chainId === 1 ? DEPOSITORY_ABI_MAINNET : DEPOSITORY_ABI_GOERLI,
    getContractAddress('depository', chainId),
  );
  return contract;
};

export const getDispenserContract = (p, chainId) => {
  const web3 = new Web3(p);
  const contract = new web3.eth.Contract(
    chainId === 1 ? DISPENSER_ABI_MAINNET : DISPENSER_ABI_GOERLI,
    getContractAddress('dispenser', chainId),
  );
  return contract;
};

export const getTreasuryContract = (p, chainId) => {
  const web3 = new Web3(p);
  const contract = new web3.eth.Contract(
    chainId === 1 ? TREASURY_ABI_MAINNET : TREASURY_ABI_GOERLI,
    getContractAddress('treasury', chainId),
  );
  return contract;
};
