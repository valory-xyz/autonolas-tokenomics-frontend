import { useState } from 'react';
import styled from 'styled-components';
import { Typography, Radio } from 'antd/lib';
import { BONDING_PRODUCTS } from 'util/constants';
import { BondingList } from './Bonding/BondingList';

const { Title } = Typography;

const ProductContainer = styled.div`
  .ant-typography {
    display: flex;
    align-items: center;
  }
`;

export const BondingProducts = () => {
  // if user not connected, show all products
  const [bondingProgramType, setProductType] = useState(
    BONDING_PRODUCTS.ACTIVE,
  );

  const onChange = (e) => {
    setProductType(e.target.value);
  };

  return (
    <ProductContainer>
      <Title level={2} className="choose-type-group">
        Bonding Products
        <Radio.Group onChange={onChange} value={bondingProgramType}>
          <Radio value={BONDING_PRODUCTS.ALL}>All</Radio>
          <Radio value={BONDING_PRODUCTS.ACTIVE}>Active</Radio>
          <Radio value={BONDING_PRODUCTS.INACTIVE}>Inactive</Radio>
        </Radio.Group>
      </Title>

      <BondingList bondingProgramType={bondingProgramType} />
    </ProductContainer>
  );
};
