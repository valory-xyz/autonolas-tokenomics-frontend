import { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Button, Table, Tag, Tooltip,
} from 'antd/lib';
import { remove, round } from 'lodash';
import { COLOR } from '@autonolas/frontend-library';
import {
  notifyError,
  getFormattedDate,
  parseToEth,
} from 'common-util/functions';
import { useHelpers } from 'common-util/hooks/useHelpers';
import { Deposit } from './Deposit';
import { getProductListRequest, getAllTheProductsNotRemoved, getApyRequest } from './requests';

const getColumns = (showNoSupply, onClick, isActive, acc) => {
  const columns = [
    {
      title: (
        <Tooltip title="Identifier of bonding product">Bonding Product</Tooltip>
      ),
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: (
        <Tooltip title="Uniswap v2 LP token address enabled by the Treasury">
          <span>LP Token</span>
        </Tooltip>
      ),
      dataIndex: 'lpTokenName',
      key: 'lpTokenName',
      render: (x, data) => (
        <a
          href={`https://v2.info.uniswap.org/pair/${data.token}`}
          target="_blank"
          rel="noreferrer"
        >
          {x}
        </a>
      ),
    },
    {
      title: (
        <Tooltip title="LP token price at which an LP share is priced during the bonding product">
          <span>OLAS per LP token minted</span>
        </Tooltip>
      ),
      dataIndex: 'priceLP',
      key: 'priceLP',
      render: (x) => `${round(parseToEth(x), 4)}`,
    },
    {
      title: (
        <Tooltip title="Percentage of discount depending on the usefulness of the code in the ecosystem">
          Discount
        </Tooltip>
      ),
      dataIndex: 'discount',
      key: 'discount',
      render: (x) => (
        <Tag color={COLOR.PRIMARY} key={x}>
          {`${x}%`}
        </Tag>
      ),
    },
    {
      title: (
        <Tooltip title="OLAS supply reserved for this bonding product">
          <span>OLAS Supply</span>
        </Tooltip>
      ),
      dataIndex: 'supply',
      key: 'supply',
      render: (x) => `${parseToEth(x)}`,
    },
    {
      title: (
        <Tooltip title="APY">
          <span>APY</span>
        </Tooltip>
      ),
      dataIndex: 'apy',
      key: 'apy',
      render: (text) => text || '--',
    },
    {
      title: (
        <Tooltip title="The vesting time to withdraw OLAS">
          <span>Expiry</span>
        </Tooltip>
      ),
      dataIndex: 'expiry',
      key: 'expiry',
      render: (seconds) => getFormattedDate(seconds * 1000),
    },
    {
      title: (
        <Tooltip title="Bond your LP pair to get OLAS at a discount">
          Bond
        </Tooltip>
      ),
      dataIndex: 'bondForOlas',
      key: 'bondForOlas',
      render: (_, row) => (
        <Button
          type="primary"
          // disbled if there is no supply or if the user is not connected
          disabled={showNoSupply || !acc}
          onClick={() => onClick(row.token)}
        >
          Create Bond
        </Button>
      ),
    },
  ];

  // should remove the bond button if the product is not active
  if (!isActive) {
    const withoutCreateBond = remove(
      [...columns],
      (x) => x.key !== 'bondForOlas',
    );
    return withoutCreateBond;
  }

  return columns;
};

export const BondingList = ({ bondingProgramType }) => {
  const { account, chainId } = useHelpers();
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const showNoSupply = bondingProgramType === 'allProduct';

  // if productToken is `not null`, then open the deposit modal
  const [productToken, setProductToken] = useState(false);

  const isActive = bondingProgramType === 'active';

  const getProducts = useCallback(async () => {
    try {
      setIsLoading(true);

      // If bondingProgramType is allProduct, we will get all the products
      // that are not removed
      if (showNoSupply) {
        const productList = await getAllTheProductsNotRemoved();
        setProducts(productList);
      } else {
        const productList = await getProductListRequest({
          account,
          isActive,
        });
        setProducts(productList);
      }
    } catch (error) {
      window.console.error(error);
      notifyError();
    } finally {
      setIsLoading(false);
    }
  }, [account, chainId, bondingProgramType]);

  // fetch the bonding list
  useEffect(() => {
    if (account && chainId) {
      getProducts();

      // TODO: add it correctly
      getApyRequest({});
    }
  }, [account, chainId, bondingProgramType]);

  const onBondClick = (token) => {
    setProductToken(token);
  };

  return (
    <>
      <Table
        columns={getColumns(showNoSupply, onBondClick, isActive, account)}
        dataSource={products}
        bordered
        loading={isLoading}
        pagination={false}
        scroll={{ x: 400 }}
      />

      {!!productToken && (
        <Deposit
          productId={products.find((e) => e.token === productToken)?.id}
          productToken={productToken}
          getProducts={getProducts}
          closeModal={() => setProductToken(null)}
        />
      )}
    </>
  );
};

BondingList.propTypes = {
  bondingProgramType: PropTypes.string,
};

BondingList.defaultProps = {
  bondingProgramType: 'active',
};
