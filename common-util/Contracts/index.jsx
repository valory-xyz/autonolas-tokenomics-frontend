import Web3 from 'web3';

import { LOCAL_CHAIN_ID, LOCAL_FORK_ID } from 'util/constants';
import { getChainId, getProvider } from 'common-util/functions';
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

export const ADDRESSES = {
  1: {
    dispenser: DISPENSER.addresses[1],
    depository: DEPOSITORY.addresses[1],
    treasury: TREASURY.addresses[1],
    tokenomics: TOKENOMICS.addresses[1],
    genericBondCalculator: BOND_CALCULATOR.addresses[1],
    agent: AGENT_REGISTRY.addresses[1],
    component: COMPONENT_REGISTRY.addresses[1],
    service: SERVICE_REGISTRY.addresses[1],
  },
  5: {
    dispenser: DISPENSER.addresses[5],
    depository: DEPOSITORY.addresses[5],
    treasury: TREASURY.addresses[5],
    tokenomics: TOKENOMICS.addresses[5],
    genericBondCalculator: BOND_CALCULATOR.addresses[5],
    agent: AGENT_REGISTRY.addresses[5],
    component: COMPONENT_REGISTRY.addresses[5],
    service: SERVICE_REGISTRY.addresses[5],
  },
  100: {
    // gnosis
  },
  [LOCAL_CHAIN_ID]: {
    dispenser: '0x4c5859f0F772848b2D91F1D83E2Fe57935348029',
    depository: '0x1291Be112d480055DaFd8a610b7d1e203891C274',
    treasury: '0x36C02dA8a0983159322a80FFE9F24b1acfF8B570',
    tokenomics: '0x5eb3Bc0a489C5A8288765d2336659EbCA68FCd00',
    genericBondCalculator: '0x809d550fca64d94Bd9F66E60752A544199cfAC3D',
    agent: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    component: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    service: '0x36C02dA8a0983159322a80FFE9F24b1acfF8B570',
  },
};

/**
 * returns the web3 details
 */
const getWeb3Details = () => {
  const web3 = new Web3(getProvider());
  const chainId = getChainId();
  return { web3, chainId };
};

/**
 * returns the contract instance
 * @param {Array} abi - abi of the contract
 * @param {String} contractAddress - address of the contract
 */
const getContract = (abi, contractAddress) => {
  const { web3 } = getWeb3Details();
  const contract = new web3.eth.Contract(abi, contractAddress);
  return contract;
};

export const getDepositoryContract = () => {
  const { chainId } = getWeb3Details();
  const contract = getContract(DEPOSITORY.abi, ADDRESSES[chainId].depository);
  return contract;
};

export const getDispenserContract = () => {
  const { chainId } = getWeb3Details();
  const contract = getContract(DISPENSER.abi, ADDRESSES[chainId].dispenser);
  return contract;
};

export const getTreasuryContract = () => {
  const { chainId } = getWeb3Details();
  const contract = getContract(TREASURY.abi, ADDRESSES[chainId].treasury);
  return contract;
};

export const getTokenomicsContract = () => {
  const { chainId } = getWeb3Details();
  const contract = getContract(TOKENOMICS.abi, ADDRESSES[chainId].tokenomics);
  return contract;
};

export const getUniswapV2PairContract = (address) => {
  const contract = getContract(UNISWAP_V2_PAIR_ABI, address);
  return contract;
};

export const getErc20Contract = (address) => {
  const contract = getContract(ERC20_ABI, address);
  return contract;
};

export const getGenericBondCalculatorContract = () => {
  const { chainId } = getWeb3Details();
  const contract = getContract(
    BOND_CALCULATOR.abi,
    ADDRESSES[chainId].genericBondCalculator,
  );
  return contract;
};

export const getAgentContract = () => {
  const { chainId } = getWeb3Details();
  const contract = getContract(AGENT_REGISTRY.abi, ADDRESSES[chainId].agent);
  return contract;
};

export const getComponentContract = () => {
  const { chainId } = getWeb3Details();
  const contract = getContract(
    COMPONENT_REGISTRY.abi,
    ADDRESSES[chainId].component,
  );
  return contract;
};

export const getServiceContract = () => {
  const { chainId } = getWeb3Details();
  const contract = getContract(
    SERVICE_REGISTRY.abi,
    ADDRESSES[chainId].service,
  );
  return contract;
};

export const RPC_URLS = {
  1: process.env.NEXT_PUBLIC_MAINNET_URL,
  5: process.env.NEXT_PUBLIC_GOERLI_URL,
  [LOCAL_FORK_ID]: 'http://localhost:8545',
};
