import { useState } from 'react';
import { Typography } from 'antd/lib';
import { DynamicFieldsForm } from 'common-util/DynamicFieldsForm';
import { notifyError, notifySuccess, parseToWei } from 'common-util/functions';
import { useHelpers } from 'common-util/hooks/useHelpers';
import { MapIncentives } from './MapPendingIncentives';
import { getDepositoryContractRequest, getMapUnitIncentivesRequest } from './requests';

const { Title, Paragraph } = Typography;

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

      await getMapUnitIncentivesRequest({
        chainId,
      });

      notifySuccess('Deposited service donation successfully');
    } catch (error) {
      window.console.error(error);
      notifyError();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Title level={2}>Donate</Title>
      <Paragraph style={{ maxWidth: 550 }}>
        Show appreciation for the value of an autonomous service by making a
        donation. The protocol will reward devs who have contributed code for
        that service.
      </Paragraph>

      <DynamicFieldsForm
        isUnitTypeInput={false}
        inputOneLabel="Service ID"
        inputTwoLabel="Amount"
        buttonText="Add row"
        submitButtonText="Donate"
        isLoading={isLoading}
        onSubmit={onDepositServiceDonationSubmit}
      />

      <MapIncentives />
    </div>
  );
};
