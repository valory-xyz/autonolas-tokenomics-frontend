import { useState } from 'react';
import styled from 'styled-components';
import { Typography, Radio } from 'antd/lib';
import { MEDIA_QUERY } from '@autonolas/frontend-library';
import { BondingList } from './Bonding/BondingList';

const { Title } = Typography;

const ProductContainer = styled.div`
  .ant-typography {
    display: flex;
    align-items: center;
  }
  ${MEDIA_QUERY.mobileL} {
    .ant-typography {
      flex-direction: column;
    }
  }
`;

export const BondingPrograms = () => {
  const [bondingProgramType, setProductType] = useState('active');

  const onChange = (e) => {
    setProductType(e.target.value);
  };

  return (
    <ProductContainer>
      <Title level={2} className="choose-type-group">
        Bonding Products
        <Radio.Group onChange={onChange} value={bondingProgramType}>
          <Radio value="allProduct">All</Radio>
          <Radio value="active">Active</Radio>
          <Radio value="inactive">Inactive</Radio>
        </Radio.Group>
      </Title>

      <BondingList bondingProgramType={bondingProgramType} />
    </ProductContainer>
  );
};
