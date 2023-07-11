import Web3 from 'web3';
import { getChainId } from '@autonolas/frontend-library';
import {
  // depository
  DEPOSITORY_ADDRESS_GOERLI,
  DEPOSITORY_ADDRESS_MAINNET,
  DEPOSITORY_ABI,

  // dispensers
  DISPENSER_ADDRESS_GOERLI,
  DISPENSER_ADDRESS_MAINNET,
  DISPENSER_ABI,

  // treasury
  TREASURY_ADDRESS_GOERLI,
  TREASURY_ADDRESS_MAINNET,
  TREASURY_ABI,

  // tokenomics
  TOKENOMICS_PROXY_ADDRESS_GOERLI,
  TOKENOMICS_PROXY_ADDRESS_MAINNET,
  TOKENOMICS_ABI,

  // uniswap
  UNISWAP_V2_PAIR_ABI,

  // registries - agent
  AGENT_REGISTRY_ADDRESS_GOERLI,
  AGENT_REGISTRY_ADDRESS_MAINNET,
  AGENT_REGISTRY_ABI,

  // registries - component
  COMPONENT_REGISTRY_ADDRESS_GOERLI,
  COMPONENT_REGISTRY_ADDRESS_MAINNET,
  COMPONENT_REGISTRY_ABI,
} from 'common-util/AbiAndAddresses';
import { LOCAL_CHAIN_ID, LOCAL_FORK_ID } from 'util/constants';
/**
 * Addresses fetched when backend connected locally
 * (initDeploy.json in backend repository)
 */
export const LOCAL_ADDRESSES = {
  DEPOSITORY_ADDRESS_LOCAL: '0x4c5859f0F772848b2D91F1D83E2Fe57935348029',
  DISPENSER_ADDRESS_LOCAL: '0x1291Be112d480055DaFd8a610b7d1e203891C274',
  TREASURY_ADDRESS_LOCAL: '0x36C02dA8a0983159322a80FFE9F24b1acfF8B570',
  TOKENOMICS_PROXY_ADDRESS_LOCAL: '0x5eb3Bc0a489C5A8288765d2336659EbCA68FCd00',
  AGENT_REGISTRY_ADDRESS_LOCAL: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  COMPONENT_REGISTRY_ADDRESS_LOCAL:
    '0x5FbDB2315678afecb367f032d93F642f64180aa3',
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
        return LOCAL_ADDRESSES.TOKENOMICS_PROXY_ADDRESS_LOCAL;
      }
      if (chainId === 5) return TOKENOMICS_PROXY_ADDRESS_GOERLI;
      return TOKENOMICS_PROXY_ADDRESS_MAINNET;
    }

    // registries
    case 'agent': {
      if (chainId === LOCAL_CHAIN_ID) {
        return LOCAL_ADDRESSES.AGENT_REGISTRY_ADDRESS_LOCAL;
      }
      if (chainId === 5) return AGENT_REGISTRY_ADDRESS_GOERLI;
      return AGENT_REGISTRY_ADDRESS_MAINNET;
    }

    case 'component': {
      if (chainId === LOCAL_CHAIN_ID) {
        return LOCAL_ADDRESSES.COMPONENT_REGISTRY_ADDRESS_LOCAL;
      }
      if (chainId === 5) return COMPONENT_REGISTRY_ADDRESS_GOERLI;
      return COMPONENT_REGISTRY_ADDRESS_MAINNET;
    }

    default:
      throw new Error('Invalid contract type');
  }
};

/**
 * web3 provider =
 * - wallect-connect provider or
 * - currentProvider by metamask or
 * - fallback to remote mainnet [remote node provider](https://web3js.readthedocs.io/en/v1.7.5/web3.html#example-remote-node-provider)
 */
export const getMyProvider = () => window.MODAL_PROVIDER
  || window.web3?.currentProvider
  || process.env.NEXT_PUBLIC_MAINNET_URL;

export const getWeb3Details = () => {
  const web3 = new Web3(getMyProvider());
  const chainId = getChainId() || 1; // default to mainnet
  return { web3, chainId };
};

export const getDepositoryContract = (p, chainId) => {
  const web3 = new Web3(p);
  const contract = new web3.eth.Contract(
    DEPOSITORY_ABI,
    getContractAddress('depository', chainId),
  );
  return contract;
};

export const getDispenserContract = (p, chainId) => {
  const web3 = new Web3(p);
  const contract = new web3.eth.Contract(
    DISPENSER_ABI,
    getContractAddress('dispenser', chainId),
  );
  return contract;
};

export const getTreasuryContract = (p, chainId) => {
  const web3 = new Web3(getMyProvider() || p);
  const contract = new web3.eth.Contract(
    TREASURY_ABI,
    getContractAddress('treasury', chainId),
  );
  return contract;
};

export const getTokenomicsContract = (p, chainId) => {
  const web3 = new Web3(p);
  const contract = new web3.eth.Contract(
    TOKENOMICS_ABI,
    getContractAddress('tokenomics', chainId),
  );
  return contract;
};

export const getUniswapV2PairContract = (p, address) => {
  const web3 = new Web3(p);
  const contract = new web3.eth.Contract(UNISWAP_V2_PAIR_ABI, address);
  return contract;
};

export const getAgentContract = () => {
  const { web3, chainId } = getWeb3Details();
  const contract = new web3.eth.Contract(
    AGENT_REGISTRY_ABI,
    getContractAddress('agent', chainId),
  );
  return contract;
};

export const getComponentContract = () => {
  const { web3, chainId } = getWeb3Details();
  const contract = new web3.eth.Contract(
    COMPONENT_REGISTRY_ABI,
    getContractAddress('component', chainId),
  );
  return contract;
};

export const rpc = {
  1: process.env.NEXT_PUBLIC_MAINNET_URL,
  5: process.env.NEXT_PUBLIC_GOERLI_URL,
  [LOCAL_FORK_ID]: 'http://localhost:8545',
};
