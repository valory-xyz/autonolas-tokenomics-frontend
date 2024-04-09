import { createPublicClient } from 'viem';
import { http, createConfig } from 'wagmi';
import { mainnet, goerli } from 'wagmi/chains';
import { safe, walletConnect, injected } from 'wagmi/connectors';

export const projectId = process.env.NEXT_PUBLIC_WALLET_PROJECT_ID;

export const SUPPORTED_CHAINS = [mainnet, goerli];
export const SUPPORTED_CHAIN_IDS = SUPPORTED_CHAINS.map((chain) => chain.id);

const metadata = {
  name: 'OLAS Tokenomics',
  description: 'OLAS Tokenomics Web3 Modal',
  url: 'https://tokenomics.olas.network', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
};

export const fallbackClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

export const wagmiConfig = createConfig({
  autoConnect: true,
  chains: SUPPORTED_CHAINS,
  connectors: [
    injected(),
    walletConnect({ projectId, metadata, showQrModal: false }),
    safe(),
  ],
  transports: SUPPORTED_CHAINS.reduce(
    (acc, chain) => Object.assign(acc, { [chain.id]: http() }),
    {},
  ),
});
