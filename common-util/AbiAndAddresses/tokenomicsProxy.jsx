export const TOKENOMICS_PROXY_ADDRESS_MAINNET = '0xc096362fa6f4A4B1a9ea68b1043416f3381ce300';

export const TOKENOMICS_PROXY_ADDRESS_GOERLI = '0x10100e74b7F706222F8A7C0be9FC7Ae1717Ad8B2';

export const TOKENOMICS_PROXY_ABI_MAINNET = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'tokenomics',
        type: 'address',
      },
      {
        internalType: 'bytes',
        name: 'tokenomicsData',
        type: 'bytes',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'InitializationFailed',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ZeroTokenomicsAddress',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ZeroTokenomicsData',
    type: 'error',
  },
  {
    stateMutability: 'nonpayable',
    type: 'fallback',
  },
  {
    inputs: [],
    name: 'PROXY_TOKENOMICS',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];
