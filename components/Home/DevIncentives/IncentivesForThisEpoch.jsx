import { useState } from 'react';
import {
  Row, Col, Table, Typography, Alert,
} from 'antd/lib';
import { round } from 'lodash';
import { DynamicFieldsForm } from 'common-util/DynamicFieldsForm';
import { notifySpecificError, parseToEth } from 'common-util/functions';
import { useHelpers } from 'common-util/hooks/useHelpers';
import { FORM_TYPES } from 'util/constants';
import { getOwnerIncentivesRequest } from './requests';
import { RewardAndTopUpContainer } from './styles';

const { Title } = Typography;

const columns = [
  {
    title: 'Reward (ETH)',
    dataIndex: 'reward',
    key: 'reward',
  },
  {
    title: 'Top Up (OLAS)',
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
        address: values.address || account,
        chainId,
        unitIds: values.unitIds.map((e) => `${e}`),
        unitTypes: values.unitTypes.map((e) => `${e}`),
      };
      const response = await getOwnerIncentivesRequest(params);

      // set reward and top up for table
      setRewardAndTopUp([
        {
          key: '1',
          reward: round(parseToEth(response.reward), 6),
          topUp: round(parseToEth(response.topUp), 6),
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

      <Alert
        message="Note: You must be the owner of each listed unit to see the claimable incentives."
        type="info"
        showIcon
      />
      <br />

      <Row>
        <Col lg={14} xs={24}>
          <DynamicFieldsForm
            dynamicFormType={FORM_TYPES.CLAIMABLE_INCENTIVES}
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
