import { useEffect, useState } from 'react';
import { Typography, Alert } from 'antd/lib';
import { DynamicFieldsForm } from 'common-util/DynamicFieldsForm';
import { notifySuccess, notifySpecificError } from 'common-util/functions';
import { useHelpers } from 'common-util/hooks/useHelpers';
import { claimOwnerIncentivesRequest, getPausedValueRequest } from './requests';

const { Title } = Typography;

export const ClaimIncentives = () => {
  const { account, chainId } = useHelpers();
  const [isLoading, setIsLoading] = useState(false);
  const [pauseValue, setPausedValue] = useState('0');

  useEffect(() => {
    const getData = async () => {
      try {
        const value = await getPausedValueRequest({ chainId });
        setPausedValue(value);
      } catch (error) {
        notifySpecificError(error);
        window.console.error(error);
      }
    };

    if (account) {
      getData();
    }
  }, [account]);

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
      {pauseValue === '0' ? (
        <></>
      ) : (
        <>
          <Title level={3}>Claim Incentives</Title>

          {pauseValue === '1' && (
            <>
              <Alert
                message="Note: You must be the owner of each listed unit to claim incentives."
                type="info"
                showIcon
              />

              <br />
              <DynamicFieldsForm
                isLoading={isLoading}
                onSubmit={onClaimIncentivesSubmit}
                submitButtonText="Claim Incentives"
              />
            </>
          )}

          {pauseValue === '2' && (
            <>
              <Alert
                message="Note: Claim incentives is currently paused and governance can unpause withdrawals."
                type="info"
                showIcon
              />
            </>
          )}
        </>
      )}
    </>
  );
};
