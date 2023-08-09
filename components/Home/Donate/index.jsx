import { useState, useEffect } from 'react';
import { Alert, Typography } from 'antd/lib';
import { isNumber } from 'lodash';
import { DynamicFieldsForm } from 'common-util/DynamicFieldsForm';
import {
  getFullFormattedDate,
  notifyError,
  notifySuccess,
  parseToEth,
  parseToWei,
  sortUnitIdsAndTypes,
} from 'common-util/functions';
import { useHelpers } from 'common-util/hooks/useHelpers';
import { getLastEpochRequest } from '../DevIncentives/requests';
import {
  getServicesNotTerminatedOrNotDeployed,
  depositServiceDonationRequest,
  getVeOlasThresholdRequest,
  minAcceptedEthRequest,
} from './requests';
import { DonateContainer, EpochStatus } from './styles';

const { Title, Paragraph, Text } = Typography;

export const DepositServiceDonation = () => {
  const { account, chainId } = useHelpers();
  const [isLoading, setIsLoading] = useState(false);
  const [threshold, setThreshold] = useState(0);
  const [minAcceptedEth, setMinAcceptedEth] = useState(0);
  const [epochDetails, setEpochDetails] = useState(null);

  useEffect(() => {
    const getThresholdData = async () => {
      try {
        const response = await getVeOlasThresholdRequest();
        setThreshold(response);

        const minEth = await minAcceptedEthRequest();
        setMinAcceptedEth(minEth);

        const epochResponse = await getLastEpochRequest();
        setEpochDetails(epochResponse);
      } catch (error) {
        window.console.error(error);
      }
    };

    if (chainId) {
      getThresholdData();
    }
  }, [chainId]);

  const onDepositServiceDonationSubmit = async (values) => {
    try {
      setIsLoading(true);

      const [sortedUnitIds, sortedUnitTypes] = sortUnitIdsAndTypes(
        values.unitIds,
        values.unitTypes,
      );

      const serviceIds = sortedUnitIds.map((e) => `${e}`);
      const params = {
        account,
        serviceIds,
        amounts: sortedUnitTypes.map((e) => parseToWei(e)),
        totalAmount: parseToWei(sortedUnitTypes.reduce((a, b) => a + b, 0)),
      };

      const invalidServices = await getServicesNotTerminatedOrNotDeployed(
        serviceIds,
      );

      if (invalidServices.length === 0) {
        await depositServiceDonationRequest(params);
        notifySuccess('Deposited service donation successfully');
      } else {
        notifyError(
          'Provided service IDs are not deployed or terminated:',
          invalidServices.join(', '),
        );

        throw new Error('Provided service IDs are not deployed or terminated');
      }
    } catch (error) {
      window.console.error(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const epochStatusList = [
    {
      text: 'Expected end time',
      value: epochDetails?.nextEpochEndTime
        ? getFullFormattedDate(epochDetails.nextEpochEndTime * 1000)
        : '--',
    },
    {
      text: 'Epoch length',
      value: isNumber(epochDetails?.epochLen)
        ? `${epochDetails.epochLen / 3600 / 24} days`
        : '--',
    },
    {
      text: 'Previous epoch end time',
      value: epochDetails?.prevEpochEndTime
        ? getFullFormattedDate(epochDetails.prevEpochEndTime * 1000)
        : '--',
    },
  ];

  return (
    <DonateContainer>
      <div className="donate-section">
        <Title level={2}>Donate</Title>
        <Paragraph>
          Show appreciation for the value of an autonomous service by making a
          donation. The protocol will reward devs who have contributed code for
          that service.
        </Paragraph>

        <Alert
          showIcon
          type="info"
          message={(
            <>
              To boost rewards of devs with freshly minted OLAS, you must hold
              at least&nbsp;
              <Text strong>{threshold || '--'}</Text>
              &nbsp;veOLAS. Grab your veOLAS by locking OLAS&nbsp;
              <a href="https://member.olas.network/" target="_self">
                here
              </a>
              . At least&nbsp;
              <Text strong>
                {minAcceptedEth ? parseToEth(minAcceptedEth) : '--'}
                &nbsp;ETH
              </Text>
              &nbsp;of donations is required to trigger boosts.
            </>
          )}
          className="mb-16"
        />

        <DynamicFieldsForm
          isLoading={isLoading}
          isUnitTypeInput={false}
          inputOneLabel="Service ID"
          inputTwoLabel="Amount (ETH)"
          buttonText="Add row"
          submitButtonText="Donate"
          onSubmit={onDepositServiceDonationSubmit}
          canResetOnSubmit
        />
      </div>

      <div className="last-epoch-section">
        <Title level={2}>Epoch Status</Title>

        {epochStatusList.map((e, index) => (
          <EpochStatus key={`epoch-section-${index}`}>
            <Title level={5}>{`${e.text}:`}</Title>
            <Paragraph>{e.value}</Paragraph>
          </EpochStatus>
        ))}
      </div>
    </DonateContainer>
  );
};
