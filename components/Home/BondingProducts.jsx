import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Typography, Radio } from 'antd/lib';
import { BONDING_PRODUCTS } from 'util/constants';
import { useHelpers } from 'common-util/hooks/useHelpers';
import { BondingList } from './Bonding/BondingList';

const { Title } = Typography;

const ProductContainer = styled.div`
  .ant-typography {
    display: flex;
    align-items: center;
  }
`;

export const BondingProducts = () => {
  const { account } = useHelpers();

  // if user not connected, show all products
  const [bondingProgramType, setProductType] = useState(
    account ? BONDING_PRODUCTS.ACTIVE : BONDING_PRODUCTS.ALL,
  );

  useEffect(() => {
    if (account) {
      // if user is connected, show active products by default
      setProductType(BONDING_PRODUCTS.ACTIVE);
    } else {
      // if user disconnected, switch to all products
      setProductType(BONDING_PRODUCTS.ALL);
    }
  }, [account]);

  const onChange = (e) => {
    setProductType(e.target.value);
  };

  return (
    <ProductContainer>
      <Title level={2} className="choose-type-group">
        Bonding Products
        <Radio.Group
          onChange={onChange}
          value={bondingProgramType}
          disabled={!account}
        >
          <Radio value={BONDING_PRODUCTS.ALL}>All</Radio>
          <Radio value={BONDING_PRODUCTS.ACTIVE}>Active</Radio>
          <Radio value={BONDING_PRODUCTS.INACTIVE}>Inactive</Radio>
        </Radio.Group>
      </Title>

      <BondingList bondingProgramType={bondingProgramType} />
    </ProductContainer>
  );
};
