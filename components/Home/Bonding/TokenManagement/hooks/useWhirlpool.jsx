/* eslint-disable max-len */
import { useCallback, useEffect, useState } from 'react';
import {
  WhirlpoolContext,
  buildWhirlpoolClient,
  PoolUtil,
  PriceMath,
} from '@orca-so/whirlpools-sdk';
import { BN } from '@coral-xyz/anchor';

import { areAddressesEqual } from '@autonolas/frontend-library';
import { round } from 'lodash';
import Decimal from 'decimal.js';

import { ADDRESSES } from 'common-util/Contracts';
import { useSvmConnectivity } from 'common-util/hooks/useSvmConnectivity';
import { gql, GraphQLClient } from 'graphql-request';
import {
  WHIRLPOOL, // filter by whirlpool
  TICK_ARRAY_LOWER,
  ORCA,
} from './constants';

const whirlpoolQuery = async () => {
  const SHYFT_API_KEY = process.env.NEXT_PUBLIC_SHYFT_API_KEY;
  if (!SHYFT_API_KEY) {
    throw new Error('SHYFT_API_KEY is not set');
  }

  const endpoint = `https://programs.shyft.to/v0/graphql/?api_key=${SHYFT_API_KEY}`;
  const graphQLClient = new GraphQLClient(endpoint, {
    method: 'POST',
    jsonSerializer: {
      parse: JSON.parse,
      stringify: JSON.stringify,
    },
  });

  // Can build queries using Hasura: https://docs.shyft.to/solana-indexers/instant-graphql-apis/getting-started
  const query = gql`
    query FindNonZeroLiqPositionQuery(
      $where: ORCA_WHIRLPOOLS_position_bool_exp
      $orderBy: [ORCA_WHIRLPOOLS_position_order_by!]
      $limit: Int
      $offset: Int
    ) {
      ORCA_WHIRLPOOLS_position(
        limit: $limit
        offset: $offset
        order_by: $orderBy
        where: $where
      ) {
        _lamports
        feeGrowthCheckpointA
        feeGrowthCheckpointB
        feeOwedA
        feeOwedB
        liquidity
        positionMint
        tickLowerIndex
        tickUpperIndex
        whirlpool
        pubkey
        liquidity
      }
    }
  `;

  const variables = {
    where: {
      liquidity: { _gt: '0' },
      whirlpool: { _eq: WHIRLPOOL.toString() },
    },
    orderBy: { liquidity: 'desc' },
  };

  const result = (await graphQLClient.request(query, variables))
    .ORCA_WHIRLPOOLS_position;
  console.log({ result });

  const filteredPositions = result.filter(
    (e) => e.tickLowerIndex === -443584
      && e.tickUpperIndex === 443584
      && e.liquidity > 0,
  );

  const keys = filteredPositions.map((e) => e.pubkey);
  // filteredPositions.forEach((element) => {
  //   console.log(element.pubkey);
  // });
  console.log({ keys });

  return filteredPositions;
};

const useWhirlpoolQuery = () => {
  const [queryResult, setQueryResult] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const result = await whirlpoolQuery();
      setQueryResult(result);
    };
    fetchData();
  }, []);

  return queryResult;
};

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
  const positions = useWhirlpoolQuery();
  const { getWhirlpoolData } = useWhirlpool();

  console.log(positions);

  return useCallback(
    async (whirlpool) => {
      if (!positions) {
        return null;
      }

      // # Calculate full range position token reserves and their accumulated total position supply
      // reserve_token0 = 0
      // reserve_token1 = 0
      // current_supply = 0
      // for position in positions:
      //     if position.tick_lower_index == WHIRLPOOL_TICK_LOWER_INDEX and position.tick_upper_index == WHIRLPOOL_TICK_UPPER_INDEX:
      //         #print(str(position.pubkey), str(position.whirlpool), position.tick_lower_index, position.tick_upper_index)
      //         amounts = LiquidityMath.get_token_amounts_from_liquidity(
      //             position.liquidity,
      //             whirlpool.sqrt_price,
      //             PriceMath.tick_index_to_sqrt_price_x64(position.tick_lower_index),
      //             PriceMath.tick_index_to_sqrt_price_x64(position.tick_upper_index),
      //             False
      //         )
      //         reserve_token0 += amounts.token_a
      //         reserve_token1 += amounts.token_b
      //         current_supply += position.liquidity

      //  Find all the whirlpool positions
      // finder = AccountFinder(connection)
      // positions = await finder.find_positions_by_whirlpool(
      //     ORCA_WHIRLPOOL_PROGRAM_ID,
      //     WHIRLPOOL_PUBKEY
      // )

      const whirlpoolCtx = WhirlpoolContext.withProvider(nodeProvider, ORCA);
      const { whirlpoolData, whirlpoolTokenA, whirlpoolTokenB } = await getWhirlpoolData();

      let reserveToken0 = new BN(0);
      let reserveToken1 = new BN(0);
      let totalSupply = new BN(0);

      positions.forEach((position) => {
        const amounts = PoolUtil.getTokenAmountsFromLiquidity(
          position.liquidity,
          whirlpoolData.sqrtPrice,
          PriceMath.tickIndexToSqrtPriceX64(position.tickLowerIndex),
          PriceMath.tickIndexToSqrtPriceX64(position.tickUpperIndex),
          false,
        );

        console.log({ amounts });

        reserveToken0 = reserveToken0.add(amounts.tokenA);
        reserveToken1 = reserveToken1.add(amounts.tokenB);
        totalSupply = totalSupply.add(new BN(position.liquidity));
        // totalSupply += position.liquidity;
      });

      console.log({
        reserveToken0,
        reserveToken1,
        totalSupply,
        str1: reserveToken0.toString(),
        str2: reserveToken1.toString(),
      });

      // const tickArrayLower = await whirlpoolCtx.fetcher.getTickArray(
      //   TICK_ARRAY_LOWER,
      // );

      const address1 = whirlpoolTokenA.mint.toString();
      const address2 = ADDRESSES.svm.olasAddress;
      // console.log(address1, address2, whirlpoolTokenA.supply);

      const reserveOlas = areAddressesEqual(address1, address2)
        ? reserveToken0
        : reserveToken1;
      // console.log(reserveOlas, totalSupply);

      console.log({
        reserveOlas: reserveOlas.toNumber(),
        totalSupply: totalSupply.toNumber(),
        divValue: reserveOlas.div(totalSupply).toNumber(),
        divValueNumber: ((reserveOlas / totalSupply) * 2) * 10 ** 18,
      });

      const priceLP = round(
        reserveOlas.div(totalSupply).toNumber() * 2,
        // (Decimal(Number(reserveOlas)) / Decimal(totalSupply)) * 2,
        18,
      );

      console.log({ priceLP });

      return priceLP;
      // return 0;
    },
    [nodeProvider, positions, getWhirlpoolData],
  );
};

/**
 * [
 * 38xeYUFRaUJb1FXYgAuNPqxc5p5nBGWmJx6yt4Y4tdRm,
 *7pT7VNZQDkFFmAgme8dW9EBKQBVNYwohzrSndvJgqd8v
 *
 * ]
 */
