import { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Button, Table, Tag, Tooltip,
} from 'antd/lib';
import { COLOR } from '@autonolas/frontend-library';
import {
  notifyError,
  getFormattedDate,
  parseToEth,
} from 'common-util/functions';
import { useHelpers } from 'common-util/hooks/useHelpers';
import { Deposit } from './Deposit';
import { getProductListRequest, getAllTheProductsNotRemoved } from './requests';

const getColumns = (showNoSupply, onClick) => [
  {
    title: 'Bonding Program ID',
    dataIndex: 'id',
    key: 'id',
  },
  {
    title: (
      <Tooltip title="Uniswap v2 LP token address enabled by the Treasury">
        <span>Token</span>
      </Tooltip>
    ),
    dataIndex: 'token',
    key: 'token',
  },
  {
    title: (
      <Tooltip
        title="LP token price with 18 decimals and non-zero at which an LP
      share is priced during the bonding program"
      >
        <span>Price LP</span>
      </Tooltip>
    ),
    dataIndex: 'priceLP',
    key: 'priceLP',
    render: (x) => `${parseToEth(x)} ETH`,
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
    title: (
      <Tooltip
        title="OLAS supply (non-zero and beyond the limit fixed by the
          tokenomics to fund bonding programs and not overflowing the contract
          limit) that will be reserved to fund OLAS for this bonding program"
      >
        <span>Supply</span>
      </Tooltip>
    ),
    dataIndex: 'supply',
    key: 'supply',
    render: (x) => `${parseToEth(x)} ETH`,
  },
  {
    title: (
      <Tooltip
        title="the vesting time (bigger or equal to the minimal vesting value) in
      seconds that a bonder has to wait before being able to withdraw OLAS"
      >
        <span>Expiry</span>
      </Tooltip>
    ),
    dataIndex: 'expiry',
    key: 'expiry',
    render: (seconds) => getFormattedDate(seconds * 1000),
  },
  {
    title: 'Bond',
    dataIndex: 'bondForOlas',
    key: 'bondForOlas',
    render: (_, row) => (
      <Button
        type="primary"
        disabled={showNoSupply}
        onClick={() => onClick(row.token)}
      >
        Create Bond
      </Button>
    ),
  },
];

export const ProductList = ({ productType }) => {
  const { account, chainId } = useHelpers();
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const showNoSupply = productType === 'allProduct';

  // if productToken is `not null`, then open the deposit modal
  const [productToken, setProductToken] = useState(false);

  const getProducts = useCallback(async () => {
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
    } catch (error) {
      window.console.error(error);
      notifyError();
    } finally {
      setIsLoading(false);
    }
  }, [account, chainId, productType]);

  // fetch the product list
  useEffect(() => {
    if (account && chainId) {
      getProducts();
    }
  }, [account, chainId, productType]);

  const onBondClick = (token) => {
    setProductToken(token);
  };

  return (
    <>
      <Table
        columns={getColumns(showNoSupply, onBondClick)}
        dataSource={products}
        bordered
        loading={isLoading}
        pagination={false}
        scroll={{ x: 400 }}
        // components={{
        //   header: {
        //     cell: ({ children, ...rest }) => {
        //       console.log('children', children);
        //       return (
        //         <Tooltip title="das">
        //           <th {...rest} style={{ backgroundColor: COLOR.PRIMARY }}>
        //             {children}
        //           </th>
        //         </Tooltip>
        //       );
        //     },
        //   },
        // }}
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

ProductList.propTypes = {
  productType: PropTypes.string,
};

ProductList.defaultProps = {
  productType: 'active',
};
