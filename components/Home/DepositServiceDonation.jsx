import { useState } from 'react';
import { Typography } from 'antd/lib';
import { DynamicFieldsForm } from 'common-util/DynamicFieldsForm';
import { notifyError, notifySuccess, parseToWei } from 'common-util/functions';
import { useHelpers } from 'common-util/hooks/useHelpers';
import { getDepositoryContractRequest } from './contractUtils';

const { Title, Paragraph, Text } = Typography;

export const DepositServiceDonation = () => {
  const { account, chainId } = useHelpers();
  const [isLoading, setIsLoading] = useState(false);

  const onDepositServiceDonationSubmit = async (values) => {
    try {
      setIsLoading(true);
      const params = {
        account,
        chainId,
        serviceIds: values.unitIds.map((e) => `${e}`),
        amounts: values.unitTypes.map((e) => parseToWei(e)),
        totalAmount: parseToWei(values.unitTypes.reduce((a, b) => a + b, 0)),
      };

      await getDepositoryContractRequest(params);
      notifySuccess('Deposited service donation successfully');
      setIsLoading(false);
    } catch (error) {
      window.console.error(error);
      notifyError();
    } finally {
      setIsLoading(false);
    }
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
        isUnitTypeInput={false}
        inputOneLabel="Service ID"
        inputTwoLabel="Amount"
        buttonText="Add Service"
        isLoading={isLoading}
        onSubmit={onDepositServiceDonationSubmit}
      />
    </div>
  );
};
