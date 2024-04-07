import { wagmiConfig } from 'common-util/config/wagmi';

import { createWeb3Modal } from '@web3modal/wagmi';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { WagmiProvider } from 'wagmi';

// Setup queryClient
const queryClient = new QueryClient();

// Create modal
// eslint-disable-next-line jest/require-hook
createWeb3Modal({
  wagmiConfig: wagmiConfig,
  projectId: process.env.NEXT_PUBLIC_WALLET_PROJECT_ID,
  enableAnalytics: false,
  enableOnramp: false,
});

export default function Web3ModalProvider({ children, initialState }) {
  return (
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
