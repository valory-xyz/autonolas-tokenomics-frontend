import { useState } from 'react';
import { Divider } from 'antd/lib';
import { DynamicFieldsForm } from 'common-util/DynamicFieldsForm';
import { notifySuccess, notifySpecificError } from 'common-util/functions';
import { useHelpers } from 'common-util/hooks/useHelpers';
import { claimOwnerIncentivesRequest } from '../requests';

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

      notifySuccess('Claimed owner incentives successfully');
    } catch (error) {
      notifySpecificError(error);
      window.console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Divider orientation="left">Claim Owner Incentives</Divider>
      <DynamicFieldsForm
        isLoading={isLoading}
        onSubmit={onClaimIncentivesSubmit}
      />
    </>
  );
};
