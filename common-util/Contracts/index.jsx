import Web3 from 'web3';
import { ethers } from 'ethers';
import { getChainId } from '@autonolas/frontend-library';
import {
  DEPOSITORY,
  DISPENSER,
  TREASURY,
  TOKENOMICS,
  BOND_CALCULATOR,
  UNISWAP_V2_PAIR_ABI,
  AGENT_REGISTRY,
  COMPONENT_REGISTRY,
  SERVICE_REGISTRY,
  ERC20_ABI,
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
  SERVICE_REGISTRY_ADDRESS_LOCAL: '0x36C02dA8a0983159322a80FFE9F24b1acfF8B570',
  GENERIC_BOND_CALC_ADDRESS: '0x809d550fca64d94Bd9F66E60752A544199cfAC3D',
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
      if (chainId === 5) return DISPENSER.addresses[5];
      return DISPENSER.addresses[1];
    }

    case 'depository': {
      if (chainId === LOCAL_CHAIN_ID) {
        return LOCAL_ADDRESSES.DEPOSITORY_ADDRESS_LOCAL;
      }
      if (chainId === 5) return DEPOSITORY.addresses[5];
      return DEPOSITORY.addresses[1];
    }

    case 'treasury': {
      if (chainId === LOCAL_CHAIN_ID) {
        return LOCAL_ADDRESSES.TREASURY_ADDRESS_LOCAL;
      }
      if (chainId === 5) return TREASURY.addresses[5];
      return TREASURY.addresses[1];
    }

    case 'tokenomics': {
      if (chainId === LOCAL_CHAIN_ID) {
        return LOCAL_ADDRESSES.TOKENOMICS_PROXY_ADDRESS_LOCAL;
      }
      if (chainId === 5) return TOKENOMICS.addresses[5];
      return TOKENOMICS.addresses[1];
    }

    case 'genericBondCalculator': {
      if (chainId === LOCAL_CHAIN_ID) {
        return LOCAL_ADDRESSES.GENERIC_BOND_CALC_ADDRESS;
      }
      if (chainId === 5) return BOND_CALCULATOR.addresses[5];
      return BOND_CALCULATOR.addresses[1];
    }

    // registries
    case 'agent': {
      if (chainId === LOCAL_CHAIN_ID) {
        return LOCAL_ADDRESSES.AGENT_REGISTRY_ADDRESS_LOCAL;
      }
      if (chainId === 5) return AGENT_REGISTRY.addresses[5];
      return AGENT_REGISTRY.addresses[1];
    }

    case 'component': {
      if (chainId === LOCAL_CHAIN_ID) {
        return LOCAL_ADDRESSES.COMPONENT_REGISTRY_ADDRESS_LOCAL;
      }
      if (chainId === 5) return COMPONENT_REGISTRY.addresses[5];
      return COMPONENT_REGISTRY.addresses[1];
    }

    case 'service': {
      if (chainId === LOCAL_CHAIN_ID) {
        return LOCAL_ADDRESSES.SERVICE_REGISTRY_ADDRESS_LOCAL;
      }
      if (chainId === 5) return SERVICE_REGISTRY.addresses[5];
      return SERVICE_REGISTRY.addresses[1];
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

export const getEthersProvider = () => {
  const provider = getMyProvider();
  if (provider === process.env.NEXT_PUBLIC_MAINNET_URL) {
    return new ethers.providers.JsonRpcProvider(provider);
  }
  return new ethers.providers.Web3Provider(provider);
};

export const getWeb3Details = () => {
  const web3 = new Web3(getMyProvider());
  const chainId = getChainId() || 1; // default to mainnet
  return { web3, chainId };
};

export const getDepositoryContract = () => {
  const { web3, chainId } = getWeb3Details();
  const contract = new web3.eth.Contract(
    DEPOSITORY.abi,
    getContractAddress('depository', chainId),
  );
  return contract;
};

export const getDispenserContract = () => {
  const { web3, chainId } = getWeb3Details();
  const contract = new web3.eth.Contract(
    DISPENSER.abi,
    getContractAddress('dispenser', chainId),
  );
  return contract;
};

export const getTreasuryContract = () => {
  const { web3, chainId } = getWeb3Details();
  const contract = new web3.eth.Contract(
    TREASURY.abi,
    getContractAddress('treasury', chainId),
  );
  return contract;
};

export const getTokenomicsContract = () => {
  const { web3, chainId } = getWeb3Details();
  const contract = new web3.eth.Contract(
    TOKENOMICS.abi,
    getContractAddress('tokenomics', chainId),
  );
  return contract;
};

export const getUniswapV2PairContract = (address) => {
  const { web3 } = getWeb3Details();
  const contract = new web3.eth.Contract(UNISWAP_V2_PAIR_ABI, address);
  return contract;
};

export const getErc20Contract = (address) => {
  const { web3 } = getWeb3Details();
  const contract = new web3.eth.Contract(ERC20_ABI, address);
  return contract;
};

export const getGenericBondCalculatorContract = () => {
  const { web3, chainId } = getWeb3Details();
  const contract = new web3.eth.Contract(
    BOND_CALCULATOR.abi,
    getContractAddress('genericBondCalculator', chainId),
  );
  return contract;
};

export const getAgentContract = () => {
  const { web3, chainId } = getWeb3Details();
  const contract = new web3.eth.Contract(
    AGENT_REGISTRY.abi,
    getContractAddress('agent', chainId),
  );
  return contract;
};

export const getComponentContract = () => {
  const { web3, chainId } = getWeb3Details();
  const contract = new web3.eth.Contract(
    COMPONENT_REGISTRY.abi,
    getContractAddress('component', chainId),
  );
  return contract;
};

export const getServiceContract = () => {
  const { web3, chainId } = getWeb3Details();
  const contract = new web3.eth.Contract(
    SERVICE_REGISTRY.abi,
    getContractAddress('service', chainId),
  );
  return contract;
};

export const rpc = {
  1: process.env.NEXT_PUBLIC_MAINNET_URL,
  5: process.env.NEXT_PUBLIC_GOERLI_URL,
  [LOCAL_FORK_ID]: 'http://localhost:8545',
};
