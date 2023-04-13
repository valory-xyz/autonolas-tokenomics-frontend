import { useState } from 'react';
import {
  Row, Col, Table, Typography,
} from 'antd/lib';
import { DynamicFieldsForm } from 'common-util/DynamicFieldsForm';
import { notifySpecificError, parseToEth } from 'common-util/functions';
import { useHelpers } from 'common-util/hooks/useHelpers';
import { getOwnerIncentivesRequest } from './requests';
import { RewardAndTopUpContainer } from './styles';

const { Title } = Typography;

const columns = [
  // TODO: max of 2 decimals is enough
  {
    title: 'Reward',
    dataIndex: 'reward',
    key: 'reward',
  },
  // TODO: max of 2 decimals is enough
  {
    title: 'Top Up',
    dataIndex: 'topUp',
    key: 'topUp',
  },
];

export const IncentivesForThisEpoch = () => {
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
          reward: parseToEth(response.reward),
          topUp: parseToEth(response.topUp),
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
      <Title level={3}>Claimable Incentives up to this epoch</Title>

      <Row>
        <Col lg={14} xs={24}>
          <DynamicFieldsForm
            isLoading={isLoading}
            onSubmit={getIncentives}
            submitButtonText="Check Incentives"
          />
        </Col>

        <Col lg={10} xs={24}>
          {rewardAndTopUp.length > 0 && (
            <RewardAndTopUpContainer>
              <Table
                columns={columns}
                dataSource={rewardAndTopUp}
                bordered
                pagination={false}
              />
            </RewardAndTopUpContainer>
          )}
        </Col>
      </Row>
    </>
  );
};
