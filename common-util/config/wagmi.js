import { http, createConfig, fallback, webSocket } from 'wagmi';
import { mainnet, goerli } from 'wagmi/chains';
import { safe, walletConnect, injected } from 'wagmi/connectors';

export const projectId = process.env.NEXT_PUBLIC_WALLET_PROJECT_ID;

export const SUPPORTED_CHAINS = [mainnet, goerli];

const metadata = {
  name: 'Web3Modal',
  description: 'Web3Modal Example',
  url: 'https://web3modal.com', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
};

export const wagmiConfig = createConfig({
  autoConnect: true,
  logger: { warn: null },
  chains: SUPPORTED_CHAINS,
  connectors: [
    // ...w3mConnectors({
    //   projectId,
    //   version: 2,
    //   chains,
    // }),
    injected(),
    walletConnect({ projectId, metadata, showQrModal: false }),
    safe(),
  ],
  transports: SUPPORTED_CHAINS.reduce(
    (acc, chain) =>
      Object.assign(acc, { [chain.id]: fallback([http(), webSocket()]) }),
    {},
  ),
  // webSocketPublicClient,
});

