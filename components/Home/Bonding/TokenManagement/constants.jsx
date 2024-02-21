import { web3 } from '@coral-xyz/anchor';

import { ADDRESSES } from 'common-util/Contracts';

export const PROGRAM_ID = new web3.PublicKey(
  '7ahQGWysExobjeZ91RTsNqTCN3kWyHGZ43ud2vB7VVoZ',
);
export const ORCA = new web3.PublicKey(
  'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
);
export const WHIRLPOOL = new web3.PublicKey(ADDRESSES.svm.balancerVault);
export const SOL = new web3.PublicKey(
  'So11111111111111111111111111111111111111112',
);
export const BRIDGED_TOKEN_MINT = new web3.PublicKey(
  'So11111111111111111111111111111111111111112', // TODO: dummy address for now, real one will be added later
);
export const PDA_POSITION_ACCOUNT = new web3.PublicKey(
  'So11111111111111111111111111111111111111112', // TODO: dummy address for now, real one will be added later
);
export const FEE_COLLECTOR_TOKEN_OWNER_ACCOUNT_A = new web3.PublicKey(
  'So11111111111111111111111111111111111111112', // TODO: dummy address for now, real one will be added later
);
export const FEE_COLLECTOR_TOKEN_OWNER_ACCOUNT_B = new web3.PublicKey(
  'So11111111111111111111111111111111111111112', // TODO: dummy address for now, real one will be added later
);
export const LOCKBOX = new web3.PublicKey(
  'So11111111111111111111111111111111111111112', // TODO: dummy address for now, real one will be added later
);
export const POSITION = new web3.PublicKey(
  'So11111111111111111111111111111111111111112', // TODO: dummy address for now, real one will be added later
);
export const POSITION_MINT = new web3.PublicKey(
  'So11111111111111111111111111111111111111112', // TODO: dummy address for now, real one will be added later
);
export const TOKEN_VAULT_A = new web3.PublicKey(
  'CLA8hU8SkdCZ9cJVLMfZQfcgAsywZ9txBJ6qrRAqthLx',
);
export const TOKEN_VAULT_B = new web3.PublicKey(
  '6E8pzDK8uwpENc49kp5xo5EGydYjtamPSmUKXxum4ybb',
);
export const TICK_ARRAY_LOWER = new web3.PublicKey(
  '3oJAqTKTCdGvLS9zpoBquWvMjwthu9Np67Qp4W8AT843',
);
export const TICK_ARRAY_UPPER = new web3.PublicKey(
  'J3eMJUQWLmSsG5VnXVFHCGwakpKmzi4jkNvi3vbCZQ3o',
);
export const TICK_SPACING = 64;
export const WHIRLPOOL_CONFIG_ID = new web3.PublicKey(
  '2LecshUwdy9xi7meFgHtFJQNSKk4KdTrcpvaB56dP2NQ',
);
