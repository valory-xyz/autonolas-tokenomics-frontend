import { GraphQLClient } from 'graphql-request';

const requestConfig = {
  jsonSerializer: {
    parse: JSON.parse,
    stringify: JSON.stringify,
  },
};

export const AUTONOLAS_GRAPH_CLIENTS = {
  1: new GraphQLClient(
    process.env.NEXT_PUBLIC_GRAPH_ENDPOINT_MAINNET,
    requestConfig,
  ),
};

// https://docs.balancer.fi/reference/subgraph/ for future subgraph endpoints
export const BALANCER_GRAPH_CLIENTS = {
  1: new GraphQLClient(
    'https://api.studio.thegraph.com/query/75376/balancer-v2/version/latest',
    requestConfig,
  ),
  5: new GraphQLClient(
    'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-goerli-v2',
    requestConfig,
  ),
  10: new GraphQLClient(
    'https://api.studio.thegraph.com/query/75376/balancer-optimism-v2/version/latest',
    requestConfig,
  ),
  100: new GraphQLClient(
    'https://api.studio.thegraph.com/query/75376/balancer-gnosis-chain-v2/version/latest',
    requestConfig,
  ),
  137: new GraphQLClient(
    'https://api.studio.thegraph.com/query/75376/balancer-polygon-v2/version/latest',
    requestConfig,
  ),
  8453: new GraphQLClient(
    'https://api.studio.thegraph.com/query/24660/balancer-base-v2/version/latest',
    requestConfig,
  ),
  42161: new GraphQLClient(
    'https://api.studio.thegraph.com/query/75376/balancer-arbitrum-v2/version/latest',
    requestConfig,
  ),
};
