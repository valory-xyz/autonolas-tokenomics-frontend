import { useEffect, useState } from 'react';
import {
  Typography, Switch, Table, Button,
} from 'antd/lib';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { COLOR } from '@autonolas/frontend-library';
import { useHelpers } from 'common-util/hooks/useHelpers';
import { notifyError, parseToEth } from 'common-util/functions';
import { getBondsRequest, redeemRequest } from './requests';

const { Title } = Typography;

const getBondsColumns = (onClick) => [
  {
    title: 'Bond ID',
    dataIndex: 'bondId',
    key: 'bondId',
  },
  {
    title: 'Payout in OLAS',
    dataIndex: 'payout',
    key: 'payout',
    render: (value) => `${parseToEth(value)} OLAS`,
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
  {
    title: 'Redeem',
    dataIndex: 'redeem',
    key: 'redeem',
    render: (_, row) => (
      <Button
        disabled={!row.matured}
        type="primary"
        onClick={() => onClick(row.bondId)}
      >
        Redeem
      </Button>
    ),
  },
];

export const Bonds = () => {
  const { account, chainId } = useHelpers();
  const [isBondMatured, setIsBondMatured] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [bondsList, setBondsList] = useState([]);

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

  useEffect(() => {
    if (account && chainId) {
      getBondsHelper();
    }
  }, [account, chainId, isBondMatured]);

  const onRedeemClick = async (bondId) => {
    try {
      await redeemRequest({
        account,
        chainId,
        bondIds: [bondId],
      });

      // once the bond is redeemed, we need to update the list
      getBondsHelper();
    } catch (error) {
      window.console.error(error);
      notifyError();
    }
  };

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
        columns={getBondsColumns(onRedeemClick)}
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

// After the bond redeem function,
// show a notification showing the amount of bond redeemed
// Example: "You have redeemed 10 OLAS" (this is payout in OLAS)
