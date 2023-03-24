import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Table, Tag } from 'antd/lib';
import { COLOR } from '@autonolas/frontend-library';
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
    render: (x) => (
      <Tag color={COLOR.PRIMARY} key={x}>
        {`${x}%`}
      </Tag>
    ),
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
