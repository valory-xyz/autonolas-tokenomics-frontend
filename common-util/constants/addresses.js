import { CHAIN_IDS } from './chainIds.js';

export const CONTRACT_ADDRESSES = {
    Autonolas: {
        AgentRegistry: {        
            [CHAIN_IDS.mainnet]: '0x2F1f7D38e4772884b88f3eCd8B6b9faCdC319112',
            [CHAIN_IDS.goerli]: '0xEB5638eefE289691EcE01943f768EDBF96258a80',    
        },
        GenericBondCalculator: {
            [CHAIN_IDS.mainnet]: '0x1521918961bDBC9Ed4C67a7103D5999e4130E6CB',
            [CHAIN_IDS.goerli]: '0x77290FF625fc576f465D0256F6a12Ce4480a5b8a',
        },
        ComponentRegistry: {        
            [CHAIN_IDS.mainnet]: '0x15bd56669F57192a97dF41A2aa8f4403e9491776',
            [CHAIN_IDS.goerli]: '0x7Fd1F4b764fA41d19fe3f63C85d12bf64d2bbf68',
        },
        Depository: {            
            [CHAIN_IDS.mainnet]: '0xfF8697d8d2998d6AA2e09B405795C6F4BEeB0C81',
            [CHAIN_IDS.goerli]: '0x5FDc466f4A7547c876eF40CD30fFA2A89F1EcDE7',
        },
        Dispenser: {
            [CHAIN_IDS.mainnet]: '0xeED0000fE94d7cfeF4Dc0CA86a223f0F603A61B8',
            [CHAIN_IDS.goerli]: '0xeDd71796B90eaCc56B074C39BAC90ED2Ca6D93Ee',
        },
        ServiceRegistry: {
            [CHAIN_IDS.mainnet]: '0x48b6af7B12C71f09e2fC8aF4855De4Ff54e775cA',
            [CHAIN_IDS.goerli]: '0x1cEe30D08943EB58EFF84DD1AB44a6ee6FEff63a',
        },
        TokenomicsProxy: {
            [CHAIN_IDS.mainnet]: '0xc096362fa6f4A4B1a9ea68b1043416f3381ce300',
            [CHAIN_IDS.goerli]: '0x10100e74b7F706222F8A7C0be9FC7Ae1717Ad8B2',
        },
        Treasury: {
            [CHAIN_IDS.mainnet]: '0xa0DA53447C0f6C4987964d8463da7e6628B30f82',
            [CHAIN_IDS.goerli]: '0x7bedCA17D29e53C8062d10902a6219F8d1E3B9B5',
        }
    }
}

export const BALANCER_ADDRESSES = {
    VAULT: {
        [CHAIN_IDS.gnosis]: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
        [CHAIN_IDS.polygon]: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
        [CHAIN_IDS.arbitrum]: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
        [CHAIN_IDS.optimism]: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
        [CHAIN_IDS.base]: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
    },
}
    
export const ERC20_ADDRESSES = {
    OLAS: {
        [CHAIN_IDS.mainnet]: "0x0001A500A6B18995B03f44bb040A5fFc28E45CB0",
        [CHAIN_IDS.goerli]: "0xEdfc28215B1Eb6eb0be426f1f529cf691A5C2400",
        [CHAIN_IDS.gnosis]: "0xcE11e14225575945b8E6Dc0D4F2dD4C570f79d9f",
        [CHAIN_IDS.gnosisChiado]: "0xFEF5d947472e72Efbb2E388c730B7428406F2F95",
        [CHAIN_IDS.polygon]: "0xFEF5d947472e72Efbb2E388c730B7428406F2F95",
        [CHAIN_IDS.polygonMumbai]: "0x81e7Ac2D5aCA991aef9187a34C0A536FA526dD0F",
        [CHAIN_IDS.arbitrum]: "0x064f8b858c2a603e1b106a2039f5446d32dc81c1",
        [CHAIN_IDS.optimism]: "0xFC2E6e6BCbd49ccf3A5f029c79984372DcBFE527",
        [CHAIN_IDS.base]: "0x54330d28ca3357F294334BDC454a032e7f353416"
    }
}