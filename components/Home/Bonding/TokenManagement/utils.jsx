/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
export const DEFAULT_SLIPPAGE = 1;

export const SVM_EMPTY_ADDRESS = '11111111111111111111111111111111';

export const slippageValidator = (_, value) => {
  if (value < 0 || value > 100) {
    return Promise.reject(new Error('Slippage must be between 0 and 100'));
  }

  return Promise.resolve();
};

/**
 *
 * function to configure and send current transaction (ref: https://stackoverflow.com/a/73943145)
 *
 * @param {import("@solana/web3.js").Transaction} transaction
 * @param {import("@solana/web3.js").Connection} connection
 * @param {import("@solana/web3.js").PublicKey} feePayer
 * @param {import("@solana/wallet-adapter-base").SignerWalletAdapterProps['signTransaction']} signTransaction
 *
 */
export const configureAndSendCurrentTransaction = async (
  transaction,
  connection,
  feePayer,
  signTransaction,
) => {
  const blockHash = await connection.getLatestBlockhash();

  transaction.feePayer = feePayer;
  transaction.recentBlockhash = blockHash.blockhash;

  const signed = await signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signed.serialize());
  await connection.confirmTransaction({
    blockhash: blockHash.blockhash,
    lastValidBlockHeight: blockHash.lastValidBlockHeight,
    signature,
  });
  return signature;
};
