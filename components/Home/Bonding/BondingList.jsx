import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Empty,
  Popconfirm,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { round, isNaN, remove } from 'lodash';
import { COLOR, NA } from '@autonolas/frontend-library';
import {
  ExclamationCircleTwoTone,
  QuestionCircleOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';

import { BONDING_PRODUCTS } from 'util/constants';
import { notifySpecificError, parseToEth, delay } from 'common-util/functions';
import { useHelpers } from 'common-util/hooks/useHelpers';
import { ADDRESSES } from 'common-util/Contracts';
import { Deposit } from './Deposit';
import { getProductListRequest } from './requests';
import { getLpTokenWithDiscount } from './requestsHelpers';

const { Text } = Typography;

const Container = styled.div`
  .ant-table-thead > tr > th,
  .ant-table-tbody > tr > td,
  .ant-table tfoot > tr > th,
  .ant-table tfoot > tr > td {
    padding: 16px 10px;
  }
`;

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
  onClick,
  isActive,
  acc,
  depositoryAddress,
  hideEmptyProducts,
) => {
  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    {
      title: getTitle('LP Token', 'LP token address enabled by the Treasury'),
      dataIndex: 'lpTokenName',
      key: 'lpTokenName',
      render: (x, data) => {
        if (!x) return NA;
        return (
          <a href={data.lpTokenLink} target="_blank" rel="noreferrer">
            {x}
          </a>
        );
      },
    },
    {
      title: getTitle('Current Price of LP Token', 'Denominated in OLAS'),
      dataIndex: 'fullCurrentPriceLp',
      key: 'fullCurrentPriceLp',
      render: (x, details) => (
        <a
          href={details.currentPriceLpLink}
          rel="noopener noreferrer"
          target="_blank"
        >
          {x}
        </a>
      ),
    },
    {
      title: getTitle(
        'OLAS minted per LP token',
        'Price for one LP token denominated in OLAS as offered by the bonding product.',
      ),
      dataIndex: 'roundedDiscountedOlasPerLpToken',
      key: 'roundedDiscountedOlasPerLpToken',
      render: (x) => (
        <a
          href={`https://etherscan.io/address/${depositoryAddress}#readContract#F10`}
          rel="noopener noreferrer"
          target="_blank"
        >
          {x}
        </a>
      ),
    },
    {
      title: getTitle(
        'Current difference in value',
        'Percentage difference between current price of LP token and OLAS minted per LP token',
      ),
      render: (record) => {
        const { projectedChange } = record;

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
          href={`https://etherscan.io/address/${depositoryAddress}#readContract#F10`}
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
        const supplyLeftInPercent = isNaN(row.supplyLeft)
          ? 0
          : round(row.supplyLeft * 100, 0);
        return (
          <>
            <a
              href={`https://etherscan.io/address/${depositoryAddress}#readContract#F10`}
              rel="noopener noreferrer"
              target="_blank"
            >
              {round(parseToEth(x), 2)}
            </a>
            &nbsp;&nbsp;
            <Tag color={supplyLeftInPercent < 6 ? COLOR.GREY_2 : COLOR.PRIMARY}>
              {`${supplyLeftInPercent}%`}
            </Tag>
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
      render: (_, row) => {
        // disabled if there is no supply or if the user is not connected
        const isBondButtonDisabled = !hideEmptyProducts || !acc;
        const isCurrentDifferenceNegative = row.projectedChange < 0;

        // if the current difference is negative, then show a popconfirm
        // to confirm the user wants to bond
        if (isCurrentDifferenceNegative) {
          return (
            <Popconfirm
              title="Current difference in value is negative"
              description="Are you sure you want to bond?"
              okText="Proceed"
              cancelText="Cancel"
              placement="left"
              disabled={isBondButtonDisabled}
              onConfirm={() => onClick(row)}
            >
              <Button type="primary" disabled={isBondButtonDisabled}>
                Bond
              </Button>
            </Popconfirm>
          );
        }

        return (
          <Button
            type="primary"
            disabled={isBondButtonDisabled}
            onClick={() => onClick(row)}
          >
            Bond
          </Button>
        );
      },
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

const NoProducts = () => (
  <>
    <UnorderedListOutlined style={{ fontSize: 64 }} className="mb-8" />
    <br />
    No products
  </>
);

const ThisCanTakeUpTo30Seconds = () => (
  <>
    <br />
    This can take up to 30 seconds
  </>
);

export const BondingList = ({ bondingProgramType, hideEmptyProducts }) => {
  const { account, chainId } = useHelpers();
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [retry, setRetry] = useState(0);

  // if productDetails is `not null`, then open the deposit modal
  const [productDetails, setProductDetails] = useState(null);

  const isActive = bondingProgramType === BONDING_PRODUCTS.ACTIVE;
  const depositoryAddress = ADDRESSES[chainId].depository;

  const getProducts = async () => {
    try {
      setErrorState(false);
      setIsLoading(true);

      const listOne = await getProductListRequest(
        { isActive, position: 1 },
        retry,
      );
      setFilteredProducts(listOne);
      await delay(5000);

      const listTwo = await getProductListRequest(
        { isActive, position: 2 },
        retry,
      );
      setFilteredProducts((prevList) => [...prevList, ...listTwo]);
      await delay(5000);

      const listThree = await getProductListRequest(
        { isActive, position: 3 },
        retry,
      );
      setFilteredProducts((prevList) => [...prevList, ...listThree]);
    } catch (error) {
      const errorMessage = typeof error?.message === 'string' ? error.message : null;
      setErrorState(true);
      notifySpecificError('Error while fetching products', errorMessage);
      console.error(error, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // fetch the bonding list
  useEffect(() => {
    getProducts();
  }, [account, chainId, bondingProgramType, retry]);

  const onBondClick = (row) => {
    setProductDetails(row);
  };

  const onModalClose = () => {
    setProductDetails(null);
  };

  const sortList = (list) => list.sort((a, b) => {
    if (isNaN(a.projectedChange)) return 1;
    if (isNaN(b.projectedChange)) return -1;
    return b.projectedChange - a.projectedChange;
  });

  const getProductsDataSource = () => {
    const sortedList = sortList(filteredProducts);
    const processedList = hideEmptyProducts
      ? sortedList.filter((x) => x.supplyLeft > 0.00001)
      : sortedList;

    return processedList;
  };

  const handleRetry = () => {
    setRetry((prevRetry) => prevRetry + 1);
  };

  if (errorState) {
    return (
      <Container className="mt-16">
        <Empty
          description={(
            <>
              <Text className="mb-8">Couldn&apos;t fetch products</Text>
              <br />
              <Button onClick={handleRetry}>Try again</Button>
            </>
          )}
          image={(
            <ExclamationCircleTwoTone
              style={{ fontSize: '7rem' }}
              twoToneColor={COLOR.GREY_1}
            />
          )}
        />
      </Container>
    );
  }

  return (
    <Container>
      <Table
        columns={getColumns(
          onBondClick,
          isActive,
          account,
          depositoryAddress,
          hideEmptyProducts,
        )}
        locale={{
          emptyText: (
            <div style={{ padding: '5rem' }}>
              {isLoading ? ' ' : <NoProducts />}
            </div>
          ),
        }}
        dataSource={getProductsDataSource()}
        bordered
        loading={{
          spinning: isLoading,
          tip: (
            <Typography className="mt-8">
              Loading products
              {retry > 0 && <ThisCanTakeUpTo30Seconds />}
            </Typography>
          ),
          indicator: <Spin active />,
        }}
        pagination={false}
        scroll={{ x: 400 }}
        className="mb-16"
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
  hideEmptyProducts: PropTypes.bool,
};

BondingList.defaultProps = {
  bondingProgramType: 'active',
  hideEmptyProducts: 'active',
};
