import { useEffect, useState } from 'react';
import {
  Typography, Radio, Table, Button, Tooltip,
} from 'antd/lib';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { COLOR } from '@autonolas/frontend-library';
import { useHelpers } from 'common-util/hooks/useHelpers';
import { notifyError, parseToEth } from 'common-util/functions';
import { getBondsRequest, redeemRequest } from './requests';

const { Title } = Typography;

const getBondsColumns = (onClick) => [
  {
    title: 'Payout in OLAS',
    dataIndex: 'payout',
    key: 'payout',
    render: (value) => `${parseToEth(value)} ETH`,
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
    render: (_, row) => {
      const redeemButton = (
        <Button disabled={!row.matured} onClick={() => onClick(row.bondId)}>
          Redeem
        </Button>
      );

      return row.matured ? (
        redeemButton
      ) : (
        <Tooltip title="To redeem, wait until bond matures">
          {redeemButton}
        </Tooltip>
      );
    },
  },
];

export const Bonds = () => {
  const { account, chainId } = useHelpers();
  const [maturityType, setMaturityType] = useState('matured');
  const [isLoading, setIsLoading] = useState(false);
  const [bondsList, setBondsList] = useState([]);

  useEffect(() => {
    const getBondsHelper = async () => {
      try {
        setIsLoading(true);

        const bonds = await getBondsRequest({
          account,
          chainId,
          isActive: maturityType === 'matured',
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
  }, [account, chainId, maturityType]);

  const onRedeemClick = async (bondId) => {
    try {
      await redeemRequest({
        account,
        chainId,
        bondIds: [bondId],
      });
    } catch (error) {
      window.console.error(error);
      notifyError();
    }
  };

  return (
    <div>
      <Title level={2} className="choose-type-group">
        My Bonds
        <Radio.Group
          onChange={(e) => setMaturityType(e.target.value)}
          value={maturityType}
        >
          <Radio value="matured">Matured</Radio>
          <Radio value="not-matured">Not Matured</Radio>
        </Radio.Group>
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
