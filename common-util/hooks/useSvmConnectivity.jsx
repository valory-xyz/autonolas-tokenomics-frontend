import { useMemo } from 'react';
import {
  useAnchorWallet,
  useConnection,
  useWallet,
} from '@solana/wallet-adapter-react';
import { AnchorProvider } from '@project-serum/anchor';

export const useSvmConnectivity = () => {
  const wallet = useWallet();
  const anchorWallet = useAnchorWallet();
  const { connection } = useConnection();

  const anchorProvider = useMemo(
    () => new AnchorProvider(connection, anchorWallet, {
      commitment: 'processed',
    }),
    [connection, anchorWallet],
  );

  return {
    connection,
    wallet,
    anchorWallet,
    anchorProvider,
    svmWalletPublicKey: anchorWallet?.publicKey,
    isSvmWalletConnected: !!anchorWallet?.publicKey,
  };
};
