import { useEffect, useState } from 'react';
import { Typography, Switch, Table } from 'antd/lib';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
// import styled from 'styled-components';
import { useHelpers } from 'common-util/hooks/useHelpers';
import { COLOR } from '@autonolas/frontend-library';
import { getBondsRequest } from './requests';

const { Title } = Typography;

const bondsColumns = [
  {
    title: 'Bond ID',
    dataIndex: 'bondId',
    key: 'bondId',
  },
  {
    title: 'Payout in OLAS',
    dataIndex: 'payout',
    key: 'payout',
  },
  {
    title: 'Matured?',
    dataIndex: 'matured',
    key: 'matured',
    render: (value) => (value ? (
      <CheckOutlined style={{ color: COLOR.PRIMARY, fontSize: 24 }} />
    ) : (
      <CloseOutlined style={{ color: COLOR.RED, fontSize: 24 }} />
    )),
  },
];

export const Bonds = () => {
  const { account, chainId } = useHelpers();
  const [isBondMatured, setIsBondMatured] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [bondsList, setBondsList] = useState([]);

  useEffect(() => {
    const getBondsHelper = async () => {
      try {
        setIsLoading(true);

        const bonds = await getBondsRequest({
          account,
          chainId,
          isActive: isBondMatured,
        });
        setBondsList(bonds);
      } catch (error) {
        window.console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    if (account && chainId) {
      getBondsHelper();
    }
  }, [account, chainId, isBondMatured]);

  return (
    <div>
      <Title level={2}>
        Bonds
        <Switch
          checked={isBondMatured}
          checkedChildren="Matured"
          unCheckedChildren="Not Matured"
          onChange={(checked) => setIsBondMatured(checked)}
          className="ml-16"
        />
      </Title>

      <Table
        columns={bondsColumns}
        dataSource={bondsList}
        bordered
        loading={isLoading}
        pagination={false}
        scroll={{ x: 400 }}
        rowKey="bondId"
      />
    </div>
  );
};

/**
 * Show a table
 * 1. Product ID
 * 2. Payout in OLAS
 * 3. Maturity
 *
 */
