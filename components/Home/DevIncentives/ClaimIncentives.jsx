import { useState } from 'react';
import { Typography } from 'antd/lib';
import { DynamicFieldsForm } from 'common-util/DynamicFieldsForm';
import { notifySuccess, notifySpecificError } from 'common-util/functions';
import { useHelpers } from 'common-util/hooks/useHelpers';
import { claimOwnerIncentivesRequest } from './requests';

const { Title } = Typography;

export const ClaimIncentives = () => {
  const { account, chainId } = useHelpers();
  const [isLoading, setIsLoading] = useState(false);

  const onClaimIncentivesSubmit = async (values) => {
    try {
      setIsLoading(true);

      const params = {
        account,
        chainId,
        unitIds: values.unitIds.map((e) => `${e}`),
        unitTypes: values.unitTypes.map((e) => `${e}`),
      };
      await claimOwnerIncentivesRequest(params);

      notifySuccess('Incentives claimed successfully');
    } catch (error) {
      notifySpecificError(error);
      window.console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Title level={3}>Claim Incentives</Title>
      <DynamicFieldsForm
        isLoading={isLoading}
        onSubmit={onClaimIncentivesSubmit}
        submitButtonText="Claim Incentives"
      />
    </>
  );
};
