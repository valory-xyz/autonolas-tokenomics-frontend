import { useState } from 'react';
import styled from 'styled-components';
import { Typography, Radio } from 'antd/lib';
import { COLOR } from '@autonolas/frontend-library';
import { ProductList } from './Products/ProductList';

const { Title } = Typography;

const ProductContainer = styled.div`
  .ant-typography {
    display: flex;
    align-items: center;
    .ant-radio {
      display: inline-block;
      top: 2px;
    }
    .ant-radio-group {
      margin-left: 2rem;
      border: 1px solid ${COLOR.BORDER_GREY};
      padding: 2px 16px;
    }
  }
`;

export const Products = () => {
  const [productType, setProductType] = useState('active');

  const onChange = (e) => {
    setProductType(e.target.value);
  };

  return (
    <ProductContainer>
      <Title level={2}>
        Products
        <Radio.Group onChange={onChange} value={productType}>
          <Radio value="allProduct">All</Radio>
          <Radio value="active">Active</Radio>
          <Radio value="inactive">Inactive</Radio>
        </Radio.Group>
      </Title>

      <ProductList productType={productType} />
    </ProductContainer>
  );
};
