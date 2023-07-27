import { useEffect, useState, useCallback } from 'react';
import {
  Typography, Radio, Table, Button,
} from 'antd/lib';
import { round } from 'lodash';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { COLOR } from '@autonolas/frontend-library';
import { useHelpers } from 'common-util/hooks/useHelpers';
import {
  getFormattedDate,
  notifyError,
  notifySuccess,
  parseToEth,
} from 'common-util/functions';
import { getBondsRequest, redeemRequest } from './requests';

const { Title } = Typography;

const getBondsColumns = () => {
  const columns = [
    {
      title: 'Payout in OLAS',
      dataIndex: 'payout',
      key: 'payout',
      render: (value) => `${round(parseToEth(value), 4)}`,
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
      title: 'Maturity Date',
      dataIndex: 'maturityDate',
      key: 'maturityDate',
      render: (value) => (value ? getFormattedDate(value) : '--'),
    },
  ];

  return columns;
};

const BONDS = {
  MATURED: 'matured',
  NOT_MATURED: 'not-matured',
};

export const MyBonds = () => {
  const { account, chainId } = useHelpers();
  const [maturityType, setMaturityType] = useState(BONDS.NOT_MATURED);
  const [isLoading, setIsLoading] = useState(false);
  const [bondsList, setBondsList] = useState([]);
  const [selectedBondIds, setSelectedBondIds] = useState([]);
  const isActive = maturityType === BONDS.MATURED;

  const getBondsListHelper = useCallback(async () => {
    try {
      setIsLoading(true);

      const bonds = await getBondsRequest({ account, isActive });
      setBondsList(bonds);
    } catch (error) {
      window.console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [account, chainId, isActive]);

  useEffect(() => {
    if (account && chainId) {
      getBondsListHelper();
    }
  }, [account, chainId, maturityType]);

  const onRedeem = async () => {
    try {
      await redeemRequest({ account, bondIds: selectedBondIds });
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
          <Radio value={BONDS.MATURED}>Matured</Radio>
          <Radio value={BONDS.NOT_MATURED}>Not Matured</Radio>
        </Radio.Group>
      </Title>

      <Table
        columns={getBondsColumns()}
        dataSource={bondsList}
        bordered
        loading={isLoading}
        pagination={false}
        scroll={{ x: 400 }}
        rowKey="bondId"
        rowSelection={
          maturityType === BONDS.MATURED
            ? {
              type: 'checkbox',
              selectedRowKeys: selectedBondIds,
              onChange: (selectedRowKeys) => {
                setSelectedBondIds(selectedRowKeys);
              },
              // disable the checkbox if the bond is not matured
              getCheckboxProps: (record) => ({
                disabled: !record.matured,
              }),
            }
            : undefined
        }
      />

      {maturityType === BONDS.MATURED && (
        <div style={{ textAlign: 'right', marginTop: '1rem' }}>
          <Button
            disabled={!account || selectedBondIds.length === 0}
            type="primary"
            onClick={onRedeem}
          >
            Redeem
          </Button>
        </div>
      )}
    </div>
  );
};
