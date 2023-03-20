import React from 'react';
import { Typography } from 'antd/lib';
import { DynamicFieldsForm } from 'common-util/DynamicFieldsForm';
import { parseToWei } from 'common-util/functions';
// import { getDepositoryContractRequest } from './contractUtils';
import { useHelpers } from './hooks/useHelpers';

const { Title, Paragraph, Text } = Typography;

export const DepositServiceDonation = () => {
  const { account, chainId } = useHelpers();

  const onDepositServiceDonationSubmit = (values) => {
    const params = {
      account,
      chainId,
      serviceIds: values.unitIds.map((e) => `${e}`),
      amounts: values.unitTypes.map((e) => parseToWei(e)),
    };

    window.console.log(params);
    // getDepositoryContractRequest(params);
  };

  return (
    <div>
      <Title level={2}>Deposit Service donation</Title>
      <Paragraph style={{ maxWidth: 550 }}>
        Valory built the core technology behind Autonolas. The team is a
        VC-backed group of engineers, researchers and commercial thinkers.&nbsp;
        <a href="https://autonolas.network/" target="_blank" rel="noreferrer">
          <Text type="secondary" underline>
            Learn more
          </Text>
        </a>
      </Paragraph>

      <DynamicFieldsForm
        inputOneLabel="Service ID"
        inputTwoLabel="Amount"
        onSubmit={onDepositServiceDonationSubmit}
      />
    </div>
  );
};
