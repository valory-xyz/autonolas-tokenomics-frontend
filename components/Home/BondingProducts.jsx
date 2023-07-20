import { useState } from 'react';
import styled from 'styled-components';
import { Typography, Radio } from 'antd/lib';
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
    account ? 'active' : 'allProduct',
  );

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
          <Radio value="allProduct">All</Radio>
          <Radio value="active">Active</Radio>
          <Radio value="inactive">Inactive</Radio>
        </Radio.Group>
      </Title>

      <BondingList bondingProgramType={bondingProgramType} />
    </ProductContainer>
  );
};
