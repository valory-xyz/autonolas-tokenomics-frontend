import { useEffect, useState } from 'react';
import { Typography, Alert, Divider } from 'antd/lib';
import { COLOR } from '@autonolas/frontend-library';
import { DynamicFieldsForm } from 'common-util/DynamicFieldsForm';
import { notifySuccess, notifySpecificError } from 'common-util/functions';
import { useHelpers } from 'common-util/hooks/useHelpers';
import { claimOwnerIncentivesRequest, getPausedValueRequest } from './requests';

const { Title } = Typography;

export const ClaimIncentives = () => {
  const { account } = useHelpers();
  const [isLoading, setIsLoading] = useState(false);
  const [pauseValue, setPausedValue] = useState('0');

  useEffect(() => {
    const getData = async () => {
      try {
        const value = await getPausedValueRequest();
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
        unitIds: values.unitIds.map((e) => `${e}`),
        unitTypes: values.unitTypes.map((e) => `${e}`),
      };
      await claimOwnerIncentivesRequest(params);

      notifySuccess('Rewards claimed');
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
          <Divider style={{ backgroundColor: COLOR.BORDER_GREY }} />

          <Title level={3}>Claim Rewards</Title>

          {pauseValue === '1' && (
            <>
              <Alert
                message="Note: You must be the owner of each listed unit to claim rewards."
                type="info"
                showIcon
              />

              <br />
              <DynamicFieldsForm
                isLoading={isLoading}
                onSubmit={onClaimIncentivesSubmit}
                submitButtonText="Claim Rewards"
              />
            </>
          )}

          {pauseValue === '2' && (
            <>
              <Alert
                message="Note: Rewards claiming is currently paused and will resume once the governance unpauses withdrawals."
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
