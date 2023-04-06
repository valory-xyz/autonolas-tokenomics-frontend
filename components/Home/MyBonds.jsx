import { useEffect, useState, useCallback } from 'react';
import {
  Typography, Radio, Table, Button, Tooltip,
} from 'antd/lib';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { COLOR } from '@autonolas/frontend-library';
import { useHelpers } from 'common-util/hooks/useHelpers';
import { notifyError, notifySuccess, parseToEth } from 'common-util/functions';
import { getBondsRequest, redeemRequest } from './requests';

const { Title } = Typography;

const getBondsColumns = (onClick) => {
  const columns = [
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
      render: (_, row) => {
        const redeemButton = (
          <Button
            disabled={!row.matured}
            type="primary"
            onClick={() => onClick(row.bondId)}
          >
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

  return columns;
};

export const MyBonds = () => {
  const { account, chainId } = useHelpers();
  const [maturityType, setMaturityType] = useState('matured');
  const [isLoading, setIsLoading] = useState(false);
  const [bondsList, setBondsList] = useState([]);
  const isActive = maturityType === 'matured';

  const getBondsListHelper = useCallback(
    async () => {
      try {
        setIsLoading(true);

        const bonds = await getBondsRequest({
          account,
          chainId,
          isActive,
        });
        setBondsList(bonds);
      } catch (error) {
        window.console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [account, chainId, isActive],
  );

  useEffect(() => {
    if (account && chainId) {
      getBondsListHelper();
    }
  }, [account, chainId, maturityType]);

  const onRedeemClick = async (bondId) => {
    try {
      await redeemRequest({
        account,
        chainId,
        bondIds: [bondId],
      });

      notifySuccess('Redeemed successfully');

      // update the list once the bond is redeemed
      await getBondsListHelper();
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
