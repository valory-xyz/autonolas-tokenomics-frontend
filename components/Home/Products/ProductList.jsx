import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Table } from 'antd/lib';
import {
  notifyError,
  getFormattedDate,
  parseToEth,
} from 'common-util/functions';
import { useHelpers } from 'common-util/hooks/useHelpers';
import { getProductListRequest, getAllTheProductsNotRemoved } from './requests';

const getColumns = (showNoSupply) => [
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
    render: () => (
      <Button type="primary" disabled={showNoSupply}>
        Bond
      </Button>
    ),
  },
];

export const ProductList = ({ productType }) => {
  const { account, chainId } = useHelpers();
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const showNoSupply = productType === 'allProduct';

  useEffect(() => {
    const getProducts = async () => {
      try {
        setIsLoading(true);

        // If productType is allProduct, we will get all the products
        // that are not removed

        if (showNoSupply) {
          const productList = await getAllTheProductsNotRemoved({ chainId });
          setProducts(productList);
        } else {
          const productList = await getProductListRequest({
            account,
            chainId,
            isActive: productType === 'active',
          });
          setProducts(productList);
        }

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
  }, [account, chainId, productType]);

  return (
    <Table
      columns={getColumns(showNoSupply)}
      dataSource={products}
      bordered
      loading={isLoading}
      pagination={false}
      scroll={{ x: 400 }}
    />
  );
};

ProductList.propTypes = {
  productType: PropTypes.string,
};

ProductList.defaultProps = {
  productType: 'active',
};

/**
 * - Add a button similar to https://app.olympusdao.finance/?_gl=1*1hlr8kb*_ga*Njc2NTQ5OTI5LjE2NDY2NTI2OTQ.*_ga_QV7HNEEHV9*MTY3MjY3MDc5MS43LjAuMTY3MjY3MDc5MS4wLjAuMA..#/bonds/inverse
 *
 * - Token.approve() of
 * 1st arg - treasury address
 * 2nd arg - MAX_UINT256
 *
 *
 * getLastIDF calculation
 * const lastIDF = await tokenomics.getLastIDF(); // IN ETH and should be >= 1
 * const discount = (lastIDF - 1e18) / 10^16 // 1e18 is 1 ETH Value
 * // right now last IDF in 1 so answer is 0
 */
