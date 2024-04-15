import { useState } from 'react';
import styled from 'styled-components';
import { Typography, Switch, Divider, Radio, Tooltip, Flex } from 'antd';
import { useScreen } from '@autonolas/frontend-library';

import { BONDING_PRODUCTS } from 'common-util/enums';
import { BondingList } from './Bonding/BondingList/BondingList';
import { WsolTokenManagement } from './Bonding/TokenManagement/WsolTokenManagement';

const { Title } = Typography;

const PageHeader = styled.div`
  align-items: center;
  margin-bottom: 12px;
  display: ${(props) => (props.isMobile ? 'block' : 'flex')};
`;

const StyledDivider = styled(Divider)`
  margin: ${(props) => (props.isMobile ? '12px 0 ' : '0 12px ')};
`;

const SwitchContainer = styled.div`
  align-items: center;
  display: flex;
`;

const ResponsiveDivider = () => {
  const { isMobile } = useScreen();

  return (
    <StyledDivider
      isMobile={isMobile}
      type={isMobile ? 'horizontal' : 'vertical'}
    />
  );
};

export const BondingProducts = () => {
  // if user not connected, show all products
  const [bondingProgramType, setProductType] = useState(
    BONDING_PRODUCTS.ACTIVE,
  );
  const [hideEmptyProducts, setHideEmptyProducts] = useState(true);
  const { isMobile } = useScreen();

  const onChange = (e) => {
    setProductType(e.target.value);
  };

  const onToggle = (checked) => {
    setHideEmptyProducts(checked);
  };

  return (
    <>
      <PageHeader isMobile={isMobile}>
        <Flex justify="space-between" align="center" style={{ width: '100%' }}>
          <Flex>
            <Title level={4} className="mb-0 mt-0">
              Bonding Products
            </Title>
            <ResponsiveDivider />

            <Radio.Group onChange={onChange} value={bondingProgramType}>
              <Radio value={BONDING_PRODUCTS.ACTIVE}>Active</Radio>
              <Tooltip title="Currently displaying active products only. To view inactive products, call methods on the Depository contract via Etherscan.">
                <Radio value={BONDING_PRODUCTS.INACTIVE} disabled>
                  Inactive
                </Radio>
              </Tooltip>
            </Radio.Group>
            <ResponsiveDivider />

            <SwitchContainer>
              <Switch
                checked={hideEmptyProducts}
                onChange={onToggle}
                className="mr-8"
              />
              Hide empty products
            </SwitchContainer>
          </Flex>

          <Flex>
            {process.env.NEXT_PUBLIC_SOLANA_LOCKBOX_TEST ? (
              <WsolTokenManagement />
            ) : null}
          </Flex>
        </Flex>
      </PageHeader>

      <BondingList
        bondingProgramType={bondingProgramType}
        hideEmptyProducts={hideEmptyProducts}
      />
    </>
  );
};
