import { useCallback } from 'react';
import {
  WhirlpoolContext,
  buildWhirlpoolClient,
} from '@orca-so/whirlpools-sdk';
import { areAddressesEqual } from '@autonolas/frontend-library';
import { round } from 'lodash';
import Decimal from 'decimal.js';

import { ADDRESSES } from 'common-util/Contracts';
import { useSvmConnectivity } from 'common-util/hooks/useSvmConnectivity';
import { WHIRLPOOL, TICK_ARRAY_LOWER, ORCA } from './constants';

/**
 * Hook to get the data from the whirlpool
 */
export const useWhirlpool = () => {
  const { nodeProvider } = useSvmConnectivity();

  const getWhirlpoolData = useCallback(async () => {
    const whirlpoolCtx = WhirlpoolContext.withProvider(nodeProvider, ORCA);
    const client = buildWhirlpoolClient(whirlpoolCtx);
    const whirlpoolClient = await client.getPool(WHIRLPOOL);

    const whirlpoolData = whirlpoolClient.getData();
    const whirlpoolTokenA = whirlpoolClient.getTokenAInfo();
    const whirlpoolTokenB = whirlpoolClient.getTokenBInfo();

    return { whirlpoolData, whirlpoolTokenA, whirlpoolTokenB };
  }, [nodeProvider]);

  return { getWhirlpoolData };
};

export const useWhirlPoolInformation = () => {
  const { nodeProvider } = useSvmConnectivity();

  return useCallback(
    async (whirlpool) => {
      const whirlpoolCtx = WhirlpoolContext.withProvider(nodeProvider, ORCA);
      const client = buildWhirlpoolClient(whirlpoolCtx);
      const whirlpoolClient = await client.getPool(whirlpool);

      const whirlpoolTokenA = whirlpoolClient.getTokenAInfo();
      const whirlpoolTokenB = whirlpoolClient.getTokenBInfo();

      const tickArrayLower = await whirlpoolCtx.fetcher.getTickArray(
        TICK_ARRAY_LOWER,
      );

      let totalSupply = 0;
      for (let i = 0; i < tickArrayLower.ticks.length; i += 1) {
        totalSupply += tickArrayLower.ticks[i].liquidityNet;
      }

      const address1 = whirlpoolTokenA.mint.toString();
      const address2 = ADDRESSES.svm.olasAddress;
      const reserveOlas = (areAddressesEqual(address1, address2)
        ? whirlpoolTokenA.supply
        : whirlpoolTokenB.supply) * 1.0;

      const priceLP = round(
        (Decimal(reserveOlas) / Decimal(totalSupply)) * 2,
        18,
      );
      return priceLP;
    },
    [nodeProvider],
  );
};
