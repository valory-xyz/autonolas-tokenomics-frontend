import { useState } from 'react';
import styled from 'styled-components';
import { Typography, Radio } from 'antd/lib';
import { BondingList } from './Bonding/BondingList';

const { Title } = Typography;

const ProductContainer = styled.div`
  .ant-typography {
    display: flex;
    align-items: center;
  }
`;

export const Products = () => {
  const [productType, setProductType] = useState('active');

  const onChange = (e) => {
    setProductType(e.target.value);
  };

  return (
    <ProductContainer>
      <Title level={2} className="choose-type-group">
        Bonding Programs
        <Radio.Group onChange={onChange} value={productType}>
          <Radio value="allProduct">All</Radio>
          <Radio value="active">Active</Radio>
          <Radio value="inactive">Inactive</Radio>
        </Radio.Group>
      </Title>

      <BondingList productType={productType} />
    </ProductContainer>
  );
};
