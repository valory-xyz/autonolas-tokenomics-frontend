import { useEffect, useState } from 'react';
import { Table, Typography } from 'antd/lib';
import { notifyError, getFormattedDate, parseToEth } from 'common-util/functions';
import { getProductsRequest, getProductDetailsFromIdsRequest } from './contractUtils';
import { useHelpers } from './hooks/useHelpers';

const { Title } = Typography;

const columns = [
  {
    title: 'Expiry',
    dataIndex: 'expiry',
    key: 'expiry',
    render: (seconds) => getFormattedDate(seconds * 1000),
  },
  {
    title: 'Price LP',
    dataIndex: 'priceLP',
    key: 'priceLP',
    render: (x) => parseToEth(x),
  },
  {
    title: 'Supply',
    dataIndex: 'supply',
    key: 'supply',
    render: (x) => parseToEth(x),
  },
  {
    title: 'Token',
    dataIndex: 'token',
    key: 'token',
  },
];

export const Products = () => {
  const { account, chainId } = useHelpers();
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const getProducts = async () => {
      try {
        setIsLoading(true);
        const params = {
          account,
          chainId,
        };

        const productIdList = await getProductsRequest(params);
        const response = await getProductDetailsFromIdsRequest({ productIdList, chainId });
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
  }, [account, chainId]);

  return (
    <div>
      <Title level={2}>Products</Title>
      <Table
        columns={columns}
        dataSource={products}
        bordered
        loading={isLoading}
        pagination={false}
        scroll={{ x: 400 }}
      />
    </div>
  );
};
