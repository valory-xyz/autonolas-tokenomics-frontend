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

  // tokenomics
  TOKENOMICS_ADDRESS_MAINNET as TOKENOMICS_ADDRESS_GOERLI, // TODO: change to goerli address
  TOKENOMICS_ABI_MAINNET as TOKENOMICS_ABI_GOERLI, // TODO: change to goerli abi
  TOKENOMICS_ADDRESS_MAINNET,
  TOKENOMICS_ABI_MAINNET,
} from 'common-util/AbiAndAddresses';
import { LOCAL_CHAIN_ID } from 'util/constants';

/**
 * Addresses fetched when backend connected locally
 * to hardhat from initDeploy.json
 */
export const LOCAL_ADDRESSES = {
  DEPOSITORY_ADDRESS_LOCAL: '0x4c5859f0F772848b2D91F1D83E2Fe57935348029',
  DISPENSER_ADDRESS_LOCAL: '0x1291Be112d480055DaFd8a610b7d1e203891C274',
  TREASURY_ADDRESS_LOCAL: '0x36C02dA8a0983159322a80FFE9F24b1acfF8B570',
  TOKENOMICS_ADDRESS_LOCAL: '0x5eb3Bc0a489C5A8288765d2336659EbCA68FCd00',
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

    case 'tokenomics': {
      if (chainId === LOCAL_CHAIN_ID) {
        return LOCAL_ADDRESSES.TOKENOMICS_ADDRESS_LOCAL;
      }
      if (chainId === 5) return TOKENOMICS_ADDRESS_GOERLI;
      return TOKENOMICS_ADDRESS_MAINNET;
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

export const getTokenomicsContract = (p, chainId) => {
  const web3 = new Web3(p);
  const contract = new web3.eth.Contract(
    chainId === 1 ? TOKENOMICS_ABI_MAINNET : TOKENOMICS_ABI_GOERLI,
    getContractAddress('tokenomics', chainId),
  );
  return contract;
};
