import { useCallback } from 'react';
import { Transaction } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { notifyError, notifySuccess } from '@autonolas/frontend-library';

import { useSvmConnectivity } from 'common-util/hooks/useSvmConnectivity';
import { configureAndSendCurrentTransaction } from '../utils';

/**
 * hook to get or create associated token account
 */
export const useGetOrCreateAssociatedTokenAccount = () => {
  const { connection } = useConnection();
  const { svmWalletPublicKey } = useSvmConnectivity();
  const { signTransaction } = useWallet();

  return useCallback(
    async (mintToken, owner = svmWalletPublicKey) => {
      try {
        if (!svmWalletPublicKey || !signTransaction) {
          notifyError('Please connect your phantom wallet');
          return null;
        }

        const associatedToken = await getAssociatedTokenAddress(
          mintToken,
          owner,
        );

        let account = await connection.getAccountInfo(associatedToken);
        if (account) return associatedToken;

        // Create the associated token account if it does not exist
        const transactionInstructions = [];
        transactionInstructions.push(
          createAssociatedTokenAccountInstruction(
            svmWalletPublicKey,
            associatedToken,
            owner,
            mintToken,
          ),
        );

        const transaction = new Transaction().add(...transactionInstructions);
        const signature = await configureAndSendCurrentTransaction(
          transaction,
          connection,
          svmWalletPublicKey,
          signTransaction,
        );

        notifySuccess('Associated token account created', signature); // TODO: remove if not needed
        account = await connection.getAccountInfo(associatedToken);
        return account;
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    [connection, svmWalletPublicKey, signTransaction],
  );
};
