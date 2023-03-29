import { useState } from 'react';
import {
  Row, Col, Divider, Table,
} from 'antd/lib';
import { DynamicFieldsForm } from 'common-util/DynamicFieldsForm';
import { notifySpecificError } from 'common-util/functions';
import { useHelpers } from 'common-util/hooks/useHelpers';
import { getOwnerIncentivesRequest } from '../requests';

const columns = [
  {
    title: 'Reward',
    dataIndex: 'reward',
    key: 'reward',
  },
  {
    title: 'Top Up',
    dataIndex: 'topUp',
    key: 'topUp',
  },
];

export const GetIncentives = () => {
  const { account, chainId } = useHelpers();

  // fetch incentives state
  const [isLoading, setIsLoading] = useState(false);
  const [rewardAndTopUp, setRewardAndTopUp] = useState([]);

  const getIncentives = async (values) => {
    try {
      setIsLoading(true);

      const params = {
        account,
        chainId,
        unitIds: values.unitIds.map((e) => `${e}`),
        unitTypes: values.unitTypes.map((e) => `${e}`),
      };
      const response = await getOwnerIncentivesRequest(params);

      // set reward and top up for table
      setRewardAndTopUp([
        {
          key: '1',
          reward: response.reward,
          topUp: response.topUp,
        },
      ]);
    } catch (error) {
      // reset reward and top up & notify error
      setRewardAndTopUp([]);
      notifySpecificError(error);

      window.console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Divider orientation="left">Fetch Owner Incentives</Divider>
      <Row>
        <Col lg={14} xs={24}>
          <DynamicFieldsForm isLoading={isLoading} onSubmit={getIncentives} />
        </Col>

        <Col lg={10} xs={24}>
          {rewardAndTopUp.length > 0 && (
            <Table
              columns={columns}
              dataSource={rewardAndTopUp}
              bordered
              style={{ width: '400px' }}
              pagination={false}
            />
          )}
        </Col>
      </Row>
    </>
  );
};
