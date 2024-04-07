import { createWeb3Modal } from '@web3modal/wagmi';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from 'common-util/config/wagmi';
import { COLOR } from '@autonolas/frontend-library';

// Setup queryClient
const queryClient = new QueryClient();

// Create modal
// eslint-disable-next-line jest/require-hook
createWeb3Modal({
  wagmiConfig,
  projectId: process.env.NEXT_PUBLIC_WALLET_PROJECT_ID,
  enableAnalytics: false,
  enableOnramp: false,
  themeMode: 'light',
  themeVariables: {
    '--w3m-font-family':
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
    '--w3m-border-radius-master': '1px',
    '--w3m-accent': COLOR.PRIMARY,
    '--w3m-background-color': COLOR.PRIMARY,
  },
});

export default function Web3ModalProvider({ children, initialState }) {
  return (
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
