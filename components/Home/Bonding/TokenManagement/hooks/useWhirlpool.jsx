/* eslint-disable max-len */
import { useCallback } from 'react';
import {
  WhirlpoolContext,
  buildWhirlpoolClient,
  WhirlpoolAccountFetcher,
  // Account
  getAllWhirlpoolAccountsForConfig,
  ORCA_WHIRLPOOL_PROGRAM_ID,
  getAccountSize,
  AccountName,
  WHIRLPOOL_CODER,
  ParsableWhirlpool,
  PREFER_CACHE,

} from '@orca-so/whirlpools-sdk';
import { areAddressesEqual } from '@autonolas/frontend-library';
import { filter, pickBy, round } from 'lodash';
import Decimal from 'decimal.js';

import { ADDRESSES } from 'common-util/Contracts';
import { useSvmConnectivity } from 'common-util/hooks/useSvmConnectivity';
import { AddressUtil, SimpleAccountFetcher } from '@orca-so/common-sdk';
import {
  WHIRLPOOL, // filter by whirlpool
  TICK_ARRAY_LOWER,
  ORCA,
  WHIRLPOOL_CONFIG_ID,
  PROGRAM_ID,
} from './constants';

/**
 * Hook to get the data from the whirlpool
 */
export const useWhirlpool = () => {
  const { nodeProvider } = useSvmConnectivity();

  const getWhirlpoolData = useCallback(async () => {
    const whirlpoolCtx = WhirlpoolContext.withProvider(nodeProvider, ORCA);
    const client = buildWhirlpoolClient(whirlpoolCtx);
    const whirlpoolClient = await client.getPool(WHIRLPOOL);

    const gggg = client.getFetcher();

    const whirlpoolData = whirlpoolClient.getData();
    const whirlpoolTokenA = whirlpoolClient.getTokenAInfo();
    const whirlpoolTokenB = whirlpoolClient.getTokenBInfo();

    return { whirlpoolData, whirlpoolTokenA, whirlpoolTokenB };
  }, [nodeProvider]);

  return { getWhirlpoolData };
};

const filters = [
  { dataSize: (0, getAccountSize)(AccountName.Whirlpool) },
  {
    memcmp: WHIRLPOOL_CODER.memcmp(
      AccountName.Whirlpool,
      WHIRLPOOL_CONFIG_ID.toBuffer(),
    ),
  },
];

export const useWhirlPoolInformation = () => {
  const { nodeProvider, connection } = useSvmConnectivity();

  return useCallback(
    async (whirlpool) => {
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
      const client = buildWhirlpoolClient(whirlpoolCtx);
      const whirlpoolClient = await client.getPool(whirlpool);

      const fetcher = new SimpleAccountFetcher(connection);

      // async def find_positions_by_whirlpool(self, program_id: Pubkey, whirlpool: Pubkey) -> List[Position]:
      //   accounts = (await self._connection.get_program_accounts(
      //       program_id,
      //       None,
      //       "base64",
      //       None,
      //       [ACCOUNT_SIZE_POSITION, MemcmpOpts(8, str(whirlpool))]
      //   )).value

      //   return list(map(
      //       lambda a: KeyedAccountConverter.to_keyed_position(a.pubkey, AccountParser.parse_position(a.account.data)),
      //       accounts
      //   ))

      const accounts = await connection.getProgramAccounts(
        ORCA_WHIRLPOOL_PROGRAM_ID,
        {
          filters,
        },
      );
      // console.log({ accounts }); // 4167

      // const fetcher = new WhirlpoolAccountFetcher(connection);

      // const parsedAccounts = [];
      // accounts.forEach(({ pubkey, account }) => {
      //   const parsedAccount = ParsableWhirlpool.parse(pubkey, account);
      //   // (0, tiny_invariant_1.default)(!!parsedAccount, `could not parse whirlpool: ${pubkey.toBase58()}`);
      //   parsedAccounts.push([AddressUtil.toString(pubkey), parsedAccount]);
      // });
      // const mappedAccounts = new Map(parsedAccounts.map(([address, pool]) => [AddressUtil.toString(address), pool]));
      // console.log({ mappedAccounts });

      // const keys = Array.from(mappedAccounts.keys());
      // console.log({ keys });

      // const pos = await fetcher.getPositions(keys, PREFER_CACHE);
      // console.log({ pos });

      // const positions = Array.from((pos).values());
      // console.log({ positions });

      // const whirlpoolAddrs = positions
      //   .map((position) => position?.whirlpool.toBase58())
      //   .flatMap((x) => (x || []));

      // console.log({ whirlpoolAddrs });

      // const allProgramAccounts = await connection.getProgramAccounts(ORCA_WHIRLPOOL_PROGRAM_ID, {
      //   filters,
      // });
      // console.log('abcd', allProgramAccounts);

      const allAccounts = await getAllWhirlpoolAccountsForConfig({
        connection,
        configId: WHIRLPOOL_CONFIG_ID,
        programId: ORCA_WHIRLPOOL_PROGRAM_ID,
      });
      console.log(allAccounts);

      // find the whirlpool positions using the whirlpool program id
      // const myAccounts = filter(allAccounts, (account) => {
      //   const isEq = areAddressesEqual(account.key, WHIRLPOOL_CONFIG_ID.toString());
      //   console.log({ a: account.key, b: WHIRLPOOL_CONFIG_ID.toString(), isEq });
      //   return isEq;
      // });

      const grouppedByKeys = allAccounts.reduce(
        (acc, account) => {
          const key = account.key.toBase58();
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(account);
          return acc;
        },
        {},
      );
      console.log(grouppedByKeys);

      const myAccounts = pickBy(allAccounts, (value, key) => areAddressesEqual(key, WHIRLPOOL_CONFIG_ID.toString()));
      console.log(myAccounts);

      // response1.forEach((element) => {
      //   console.log(element);
      // });

      // const addresses = Array.from(response1.entries())
      //   .filter(([_address, data]) => !data.liquidity.isZero())
      //   .filter(([_address, data]) => data.configId.equals(WHIRLPOOL_CONFIG_ID))
      //   .map(([address, _data]) => address)

      // console.log('liquid whirlpools', addresses);

      // const whirlpoolTokenA = whirlpoolClient.getTokenAInfo();
      // const whirlpoolTokenB = whirlpoolClient.getTokenBInfo();

      // const tickArrayLower = await whirlpoolCtx.fetcher.getTickArray(
      //   TICK_ARRAY_LOWER,
      // );

      // let totalSupply = 0;
      // for (let i = 0; i < tickArrayLower.ticks.length; i += 1) {
      //   totalSupply += tickArrayLower.ticks[i].liquidityNet;
      // }

      // const address1 = whirlpoolTokenA.mint.toString();
      // const address2 = ADDRESSES.svm.olasAddress;
      // const reserveOlas =
      //   (areAddressesEqual(address1, address2)
      //     ? whirlpoolTokenA.supply
      //     : whirlpoolTokenB.supply) * 1.0;

      // const priceLP = round(
      //   (Decimal(reserveOlas) / Decimal(totalSupply)) * 2,
      //   18,
      // );
      // return priceLP;

      return 0;
    },
    [nodeProvider],
  );
};
