import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Table } from 'antd/lib';
import {
  notifyError,
  getFormattedDate,
  parseToEth,
} from 'common-util/functions';
import { useHelpers } from 'common-util/hooks/useHelpers';
import {
  getProductsRequest,
  getProductDetailsFromIdsRequest,
} from '../contractUtils';

const columns = [
  {
    title: 'Product ID',
    dataIndex: 'id',
    key: 'id',
  },
  {
    title: 'Token',
    dataIndex: 'token',
    key: 'token',
  },
  {
    title: 'Price LP',
    dataIndex: 'priceLP',
    key: 'priceLP',
    render: (x) => parseToEth(x),
  },
  {
    title: 'Discount',
    dataIndex: 'discount',
    key: 'discount',
    // TODO: blank for now
    // render: (x) => parseToEth(x),
  },
  {
    title: 'Supply',
    dataIndex: 'supply',
    key: 'supply',
    render: (x) => parseToEth(x),
  },
  {
    title: 'Expiry',
    dataIndex: 'expiry',
    key: 'expiry',
    render: (seconds) => getFormattedDate(seconds * 1000),
  },

  {
    title: 'Bond',
    dataIndex: 'bondForOlas',
    key: 'bondForOlas',
    render: () => <Button type="primary">Bond</Button>,
  },
];

export const ProductList = ({ isActiveProducts }) => {
  const { account, chainId } = useHelpers();
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const getProducts = async () => {
      try {
        setIsLoading(true);

        const productIdList = await getProductsRequest({
          account,
          chainId,
          isActive: isActiveProducts,
        });
        const response = await getProductDetailsFromIdsRequest({
          productIdList,
          chainId,
        });
        const productList = response.map((product, index) => ({
          id: productIdList[index],
          key: productIdList[index],
          ...product,
        }));
        setProducts(productList);
        setIsLoading(false);
      } catch (error) {
        window.console.error(error);
        notifyError();
      } finally {
        setIsLoading(false);
      }
    };

    if (account && chainId) {
      getProducts();
    }
  }, [account, chainId, isActiveProducts]);

  return (
    <Table
      columns={columns}
      dataSource={products}
      bordered
      loading={isLoading}
      pagination={false}
      scroll={{ x: 400 }}
    />
  );
};

ProductList.propTypes = {
  isActiveProducts: PropTypes.bool,
};

ProductList.defaultProps = {
  isActiveProducts: false,
};

/**
 * - Add a button similar to https://app.olympusdao.finance/?_gl=1*1hlr8kb*_ga*Njc2NTQ5OTI5LjE2NDY2NTI2OTQ.*_ga_QV7HNEEHV9*MTY3MjY3MDc5MS43LjAuMTY3MjY3MDc5MS4wLjAuMA..#/bonds/inverse
 *
 * - Token.approve() of
 * 1st arg - treasury address
 * 2nd arg - MAX_UINT256
 *
 * - Token.allowance() of
 */
