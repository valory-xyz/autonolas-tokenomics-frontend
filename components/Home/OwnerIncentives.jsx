import React from 'react';
import { Typography, Divider } from 'antd/lib';
import { DynamicFieldsForm } from 'common-util/DynamicFieldsForm';
import { notifySuccess } from 'common-util/functions';
import { getOwnerIncentivesRequest, claimOwnerIncentivesRequest } from './contractUtils';
import { useHelpers } from './hooks/useHelpers';

const { Title, Paragraph, Text } = Typography;

export const OwnerIncentives = () => {
  const { account, chainId } = useHelpers();

  const onOwnerIncentivesSubmit = async (values) => {
    const params = {
      account,
      chainId,
      unitIds: values.unitIds.map((e) => `${e}`),
      unitTypes: values.unitTypes.map((e) => `${e}`),
    };

    try {
      window.console.log(params); // TODO remove
      await getOwnerIncentivesRequest(params);
    } catch (error) {
      window.console.error(error);
    }
  };

  const onClaimOwnerIncentivesSubmit = async (values) => {
    const params = {
      account,
      chainId,
      unitIds: values.unitIds.map((e) => `${e}`),
      unitTypes: values.unitTypes.map((e) => `${e}`),
    };

    window.console.log(params); // TODO remove

    try {
      await claimOwnerIncentivesRequest(params);
      notifySuccess('Claimed owner incentives successfully');
    } catch (error) {
      window.console.error(error);
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

      <Divider orientation="left">Fetch Owner Incentives</Divider>
      <DynamicFieldsForm onSubmit={onOwnerIncentivesSubmit} />

      <br />
      <br />
      <Divider orientation="left">Claim Owner Incentives</Divider>
      <DynamicFieldsForm onSubmit={onClaimOwnerIncentivesSubmit} />
    </div>
  );
};
