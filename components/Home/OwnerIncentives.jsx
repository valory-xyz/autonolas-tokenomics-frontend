import { useState } from 'react';
import {
  Row, Col, Typography, Divider, Table,
} from 'antd/lib';
import { DynamicFieldsForm } from 'common-util/DynamicFieldsForm';
import { notifySuccess, notifySpecificError } from 'common-util/functions';
import {
  getOwnerIncentivesRequest,
  claimOwnerIncentivesRequest,
} from './contractUtils';
import { useHelpers } from './hooks/useHelpers';

const { Title, Paragraph, Text } = Typography;

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

export const OwnerIncentives = () => {
  const { account, chainId } = useHelpers();

  // fetch incentives state
  const [isGetOwnerIncentivesLoading, setIsGetOwnerIncentivesLoading] = useState(false);
  const [rewardAndTopUp, setRewardAndTopUp] = useState([]);

  // claim incentives state
  const [isClaimOwnerIncentivesLoading, setIsClaimOwnerIncentivesLoading] = useState(false);

  /**
   * fetch incentives
   */
  const onOwnerIncentivesSubmit = async (values) => {
    try {
      setIsGetOwnerIncentivesLoading(true);

      const params = {
        account,
        chainId,
        unitIds: values.unitIds.map((e) => `${e}`),
        unitTypes: values.unitTypes.map((e) => `${e}`),
      };
      const response = await getOwnerIncentivesRequest(params);

      // set reward and top up
      setIsGetOwnerIncentivesLoading(false);
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
      setIsGetOwnerIncentivesLoading(false);
    }
  };

  /**
   * claim incentives
   */
  const onClaimOwnerIncentivesSubmit = async (values) => {
    try {
      setIsClaimOwnerIncentivesLoading(true);

      const params = {
        account,
        chainId,
        unitIds: values.unitIds.map((e) => `${e}`),
        unitTypes: values.unitTypes.map((e) => `${e}`),
      };
      await claimOwnerIncentivesRequest(params);

      notifySuccess('Claimed owner incentives successfully');
      setIsClaimOwnerIncentivesLoading(false);
    } catch (error) {
      notifySpecificError(error);
      window.console.error(error);
    } finally {
      setIsClaimOwnerIncentivesLoading(false);
    }
  };

  return (
    <div>
      <Title level={2}>Owner Incentives</Title>
      <Paragraph style={{ maxWidth: 550 }}>
        Valory built the core technology behind Autonolas. The team is a
        VC-backed group of engineers, researchers and commercial thinkers.&nbsp;
        <a href="https://autonolas.network/" target="_blank" rel="noreferrer">
          <Text type="secondary" underline>
            Learn more
          </Text>
        </a>
      </Paragraph>

      {/* Get owner incentives */}
      <Divider orientation="left">Fetch Owner Incentives</Divider>
      <Row>
        <Col lg={14} xs={24}>
          <DynamicFieldsForm
            isLoading={isGetOwnerIncentivesLoading}
            onSubmit={onOwnerIncentivesSubmit}
          />
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

      <br />
      <br />

      {/* Claim incentives */}
      <Divider orientation="left">Claim Owner Incentives</Divider>
      <DynamicFieldsForm
        isLoading={isClaimOwnerIncentivesLoading}
        onSubmit={onClaimOwnerIncentivesSubmit}
      />
    </div>
  );
};
