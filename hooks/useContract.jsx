import { getContract} from 'viem';
import { useClient } from 'wagmi';

import depositoryAbi from 'common-util/abi/autonolas/depository.json';
import dispenserAbi from 'common-util/abi/autonolas/dispenser.json';
import treasuryAbi from 'common-util/abi/autonolas/treasury.json';
import tokenomicsAbi from 'common-util/abi/autonolas/tokenomics.json';
import agentRegistryAbi from 'common-util/abi/autonolas/agentRegistry.json';
import componentRegistryAbi from 'common-util/abi/autonolas/componentRegistry.json';
import serviceRegistryAbi from 'common-util/abi/autonolas/serviceRegistry.json';
import uniswapV2PairAbi from 'common-util/abi/uniswap-v2/uniswapV2Pair.json';
import genericBondCalculatorAbi from 'common-util/abi/autonolas/genericBondCalculator.json';

import erc20Abi from 'abi/erc20.json';
import { CONTRACT_ADDRESSES } from 'common-util/constants/addresses';

export const useContract = () => {
    const client = useClient();
    const getErc20Contract = (address) => getContract(erc20Abi, address, client);
    return {
        getErc20Contract,
    };
}

export const useAutonolasContract = () => {
 const client = useClient();

 const getDepositoryContract = () => getContract(depositoryAbi, CONTRACT_ADDRESSES.Autonolas.Depository, client);
  
 const getDispenserContract = () =>  getContract(dispenserAbi, CONTRACT_ADDRESSES.Autonolas.Dispenser, client);
  
 const getTreasuryContract = () => getContract(treasuryAbi, CONTRACT_ADDRESSES.Autonolas.Treasury, client);

 const getTokenomicsContract = () =>  getContract(tokenomicsAbi, CONTRACT_ADDRESSES.Autonolas.TokenomicsProxy, client); 

 const getGenericBondCalculatorContract = () => getContract(
    genericBondCalculatorAbi,
    CONTRACT_ADDRESSES.Autonolas.GenericBondCalculator,
    client
  );

 const getAgentRegistryContract = () => getContract(agentRegistryAbi, CONTRACT_ADDRESSES.Autonolas.AgentRegistry, client);
  

 const getComponentRegistryContract = () => getContract(
    componentRegistryAbi,
    CONTRACT_ADDRESSES.Autonolas.ComponentRegistry,
    client
  );

 const getServiceRegistryContract = () => getContract(
    serviceRegistryAbi,
    CONTRACT_ADDRESSES.Autonolas.ServiceRegistry,
    client
  );

  return {
    getDepositoryContract,
    getDispenserContract,
    getTreasuryContract,
    getTokenomicsContract,
    getGenericBondCalculatorContract,
    getAgentRegistryContract,
    getComponentRegistryContract,
    getServiceRegistryContract,
  };
}

export const useUniswapContract = () => {
    const client = useClient();
    
    const getUniswapV2PairContract = (address) => getContract(uniswapV2PairAbi, address, client);

    return {
        getUniswapV2PairContract,
    };
};
