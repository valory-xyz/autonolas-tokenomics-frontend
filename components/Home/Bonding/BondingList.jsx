import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import PropTypes from 'prop-types';
import {
  Button, Table, Tag, Tooltip, Typography,
} from 'antd';
import { remove, round, isNaN } from 'lodash';
import { COLOR, notifyError, NA } from '@autonolas/frontend-library';
import { QuestionCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';

import { BONDING_PRODUCTS } from 'util/constants';
import { parseToEth } from 'common-util/functions';
import { useHelpers } from 'common-util/hooks/useHelpers';
import { Deposit } from './Deposit';
import {
  getProductListRequest,
  getAllTheProductsNotRemoved,
  getDepositoryAddress,
} from './requests';

const { Text } = Typography;

const Container = styled.div`
  .ant-table-thead > tr > th,
  .ant-table-tbody > tr > td,
  .ant-table tfoot > tr > th,
  .ant-table tfoot > tr > td {
    padding: 16px 10px;
  }
`;

/**
 *
 * @param {BigNumber} lpTokenValue
 * @param {Number} discount
 * @returns {BigNumber}
 */
const getLpTokenWithDiscount = (lpTokenValue, discount) => {
  const price = ethers.BigNumber.from(lpTokenValue);
  const discountedPrice = price.add(price.mul(discount).div(100));
  return discountedPrice;
};

const displayLpTokenWithDiscount = (value) => {
  const temp = parseToEth(value);
  return round(temp, 2);
};

const buildFullCurrentPriceLp = (currentPriceLp) => Number(round(parseToEth(currentPriceLp * 2), 2)) || '--';

const getTitle = (title, tooltipDesc) => (
  <Tooltip title={tooltipDesc}>
    <span>
      {title}
      &nbsp;
      <QuestionCircleOutlined />
    </span>
  </Tooltip>
);

const getColumns = (
  showNoSupply,
  onClick,
  isActive,
  acc,
  depositoryAddress,
) => {
  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    {
      title: getTitle(
        'LP Token',
        'Uniswap v2 LP token address enabled by the Treasury',
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
      title: getTitle('Current Price of LP Token', 'Denominated in OLAS'),
      dataIndex: 'currentPriceLp',
      key: 'currentPriceLp',
      render: (text) => (
        <a
          href={`https://etherscan.io/address/${depositoryAddress}#readContract#F6`}
          rel="noopener noreferrer"
          target="_blank"
        >
          {buildFullCurrentPriceLp(text)}
        </a>
      ),
    },
    {
      title: getTitle(
        'OLAS minted per LP token',
        'Price for one LP token denominated in OLAS as offered by the bonding product.',
      ),
      dataIndex: 'priceLP',
      key: 'priceLP',
      render: (x, data) => {
        const discount = data?.discount || 0;
        const discountedPrice = getLpTokenWithDiscount(x, discount);

        return (
          <a
            href={`https://etherscan.io/address/${depositoryAddress}#readContract#F9`}
            rel="noopener noreferrer"
            target="_blank"
          >
            {displayLpTokenWithDiscount(discountedPrice)}
          </a>
        );
      },
    },
    {
      title: getTitle(
        'Current difference in value',
        'Percentage difference between current price of LP token and OLAS minted per LP token',
      ),
      render: (record) => {
        const fullCurrentPriceLp = buildFullCurrentPriceLp(
          record.currentPriceLp,
        );
        const discount = record?.discount || 0;
        const discountedOlasPerLpToken = getLpTokenWithDiscount(
          record.priceLP,
          discount,
        );
        const roundedDiscountedOlasPerLpToken = displayLpTokenWithDiscount(
          discountedOlasPerLpToken,
        );

        const projectedChange = round(
          ((roundedDiscountedOlasPerLpToken - fullCurrentPriceLp)
            / fullCurrentPriceLp)
            * 100,
          2,
        );

        if (isNaN(projectedChange)) {
          return <Text>{NA}</Text>;
        }

        return (
          <Text style={{ color: projectedChange > 0 ? 'green' : 'red' }}>
            {projectedChange > 0 && '+'}
            {projectedChange}
            %
          </Text>
        );
      },
    },
    {
      title: getTitle('Vesting', 'The bond vesting time to withdraw OLAS'),
      dataIndex: 'vesting',
      key: 'vesting',
      render: (seconds) => (
        <a
          href={`https://etherscan.io/address/${depositoryAddress}#readContract#F9`}
          rel="noopener noreferrer"
          target="_blank"
        >
          {`${seconds / 86400} days`}
        </a>
      ),
    },
    {
      title: getTitle(
        'OLAS Supply',
        'Remaining OLAS supply reserved for this bonding product',
      ),
      dataIndex: 'supply',
      key: 'supply',
      render: (x, row) => {
        const supplyLeftInPercent = round(row.supplyLeft * 100, 0);
        return (
          <>
            <a
              href={`https://etherscan.io/address/${depositoryAddress}#readContract#F9`}
              rel="noopener noreferrer"
              target="_blank"
            >
              {round(parseToEth(x), 2)}
            </a>
            &nbsp;
            <Tooltip title={`${supplyLeftInPercent}% of supply left`}>
              <Tag color={supplyLeftInPercent < 6 ? COLOR.RED : COLOR.PRIMARY}>
                {`${supplyLeftInPercent}%`}
              </Tag>
            </Tooltip>
          </>
        );
      },
    },
    {
      title: getTitle(
        'Initiate Bond',
        'Bond your LP pair to get OLAS at a discount',
      ),
      dataIndex: 'bondForOlas',
      key: 'bondForOlas',
      render: (_, row) => (
        <Button
          type="primary"
          // disbled if there is no supply or if the user is not connected
          disabled={showNoSupply || !acc}
          onClick={() => onClick(row)}
        >
          Bond
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
  const [allProducts, setAllProducts] = useState([]); // all products
  const [filteredProducts, setFilteredProducts] = useState([]); // (active / inactive products)
  const showNoSupply = bondingProgramType === BONDING_PRODUCTS.ALL;

  // if productDetails is `not null`, then open the deposit modal
  const [productDetails, setProductDetails] = useState(null);

  const isActive = bondingProgramType === BONDING_PRODUCTS.ACTIVE;
  const depositoryAddress = getDepositoryAddress(chainId);

  const getProducts = async () => {
    try {
      setIsLoading(true);

      // If bondingProgramType is allProduct, we will get all the products
      // that are not removed
      if (showNoSupply) {
        // fetches "all" products
        const productList = await getAllTheProductsNotRemoved();
        setAllProducts(productList);
      } else {
        // fetches both "active" and "inactive" products
        const filteredProductList = await getProductListRequest({ isActive });
        setFilteredProducts(filteredProductList);
      }
    } catch (error) {
      console.error(error);
      notifyError('Error while fetching products');
    } finally {
      setIsLoading(false);
    }
  };

  // fetch the bonding list
  useEffect(() => {
    console.log(chainId);
    getProducts();
  }, [account, chainId, bondingProgramType]);

  const onBondClick = (row) => {
    setProductDetails(row);
  };

  const onModalClose = () => {
    setProductDetails(null);
  };

  return (
    <Container>
      <Table
        columns={getColumns(
          showNoSupply,
          onBondClick,
          isActive,
          account,
          depositoryAddress,
        )}
        dataSource={showNoSupply ? allProducts : filteredProducts}
        bordered
        loading={isLoading}
        pagination={false}
        scroll={{ x: 400 }}
      />

      {!!productDetails && (
        <Deposit
          productId={productDetails?.id}
          productToken={productDetails?.token}
          productLpPrice={getLpTokenWithDiscount(
            productDetails?.priceLP,
            productDetails?.discount,
          )}
          productSupply={productDetails?.supply}
          getProducts={getProducts}
          closeModal={onModalClose}
        />
      )}
    </Container>
  );
};

BondingList.propTypes = {
  bondingProgramType: PropTypes.string,
};

BondingList.defaultProps = {
  bondingProgramType: 'active',
};
