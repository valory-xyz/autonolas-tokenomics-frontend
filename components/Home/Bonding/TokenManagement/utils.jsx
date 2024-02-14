export const DEFAULT_SLIPPAGE = 1;

export const SVM_EMPTY_ADDRESS = '11111111111111111111111111111111';

export const slippageValidator = (_, value) => {
  if (value < 0 || value > 100) {
    return Promise.reject(new Error('Slippage must be between 0 and 100'));
  }

  return Promise.resolve();
};
