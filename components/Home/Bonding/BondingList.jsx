import { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Button, Table, Tag, Tooltip,
} from 'antd/lib';
import { remove, round } from 'lodash';
import { COLOR } from '@autonolas/frontend-library';
import { QuestionCircleOutlined } from '@ant-design/icons';
import {
  notifyError,
  getFormattedDate,
  parseToEth,
} from 'common-util/functions';
import { useHelpers } from 'common-util/hooks/useHelpers';
import { Deposit } from './Deposit';
import { getProductListRequest, getAllTheProductsNotRemoved } from './requests';

const getLpTokenWithDiscound = (lpTokenValue, discount) => {
  const price = Number(parseToEth(lpTokenValue));
  const discountedPrice = price + (price * discount) / 100;
  return round(discountedPrice, 4);
};

const getTitle = (title, tooltipDesc) => (
  <Tooltip title={tooltipDesc}>
    <span>
      {title}
      &nbsp;
      <QuestionCircleOutlined />
    </span>
  </Tooltip>
);

// eslint-disable-next-line max-len
// const DISCOUNT = "The discount factor is determined by the activity of the protocol per epoch, and it applies to the product's calculated LP price. The more useful code that is introduced, the larger the discount factor becomes. This system is designed to stimulate the creation of more useful code.";

const APY_DESC = 'Denominated in OLAS';

const getColumns = (showNoSupply, onClick, isActive, acc) => {
  const columns = [
    {
      title: getTitle('Bonding Product', 'Identifier of bonding product'),
      dataIndex: 'id',
      key: 'id',
    },
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
      title: getTitle(
        'OLAS minted per LP token',
        'Price for one LP token denominated in OLAS as offered by the bonding product.',
      ),
      dataIndex: 'priceLP',
      key: 'priceLP',
      render: (x, data) => {
        const discount = data?.discount || 0;
        const discountedPrice = getLpTokenWithDiscound(x, discount);

        return (
          <a
            href="https://etherscan.io/address/0x52A043bcebdB2f939BaEF2E8b6F01652290eAB3f#readContract#F9"
            rel="noopener noreferrer"
            target="_blank"
          >
            {discountedPrice}
          </a>
        );
      },
    },
    // {
    //   title: getTitle('Discount', DISCOUNT),
    //   dataIndex: 'discount',
    //   key: 'discount',
    //   render: (x) => (
    //     <Tag color={COLOR.PRIMARY} key={x}>
    //       {`${x}%`}
    //     </Tag>
    //   ),
    // },
    {
      title: getTitle('Current Price of LP Token', APY_DESC),
      dataIndex: 'currentPriceLp',
      key: 'currentPriceLp',
      render: (text) => Number(round(parseToEth(text * 2), 2)) || '--',
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
              href="https://etherscan.io/address/0x52A043bcebdB2f939BaEF2E8b6F01652290eAB3f#readContract#F6"
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
      title: getTitle('Maturation Date', 'The vesting time to withdraw OLAS'),
      dataIndex: 'expiry',
      key: 'expiry',
      render: (seconds) => (
        <a
          href="https://etherscan.io/address/0x52A043bcebdB2f939BaEF2E8b6F01652290eAB3f#readContract#F9"
          rel="noopener noreferrer"
          target="_blank"
        >
          {getFormattedDate(seconds * 1000)}
        </a>
      ),
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
  const [products, setProducts] = useState([]);
  const showNoSupply = bondingProgramType === 'allProduct';

  // if productDetails is `not null`, then open the deposit modal
  const [productDetails, setProductDetails] = useState(null);

  const isActive = bondingProgramType === 'active';

  const getProducts = useCallback(async () => {
    try {
      setIsLoading(true);

      // If bondingProgramType is allProduct, we will get all the products
      // that are not removed
      if (showNoSupply) {
        const productList = await getAllTheProductsNotRemoved();
        setProducts(productList);
      } else if (account) {
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
    getProducts();
  }, [account, chainId, bondingProgramType]);

  const onBondClick = (row) => {
    setProductDetails(row);
  };

  const onModalClose = () => {
    setProductDetails(null);
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

      {!!productDetails && (
        <Deposit
          productId={productDetails?.id}
          productToken={productDetails?.token}
          productLpPrice={getLpTokenWithDiscound(
            productDetails?.priceLP,
            productDetails?.discount,
          )}
          getProducts={getProducts}
          closeModal={onModalClose}
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
