import { useState, useEffect } from 'react';
import { Alert, Typography } from 'antd/lib';
import { DynamicFieldsForm } from 'common-util/DynamicFieldsForm';
import {
  notifyError,
  notifySuccess,
  parseToEth,
  parseToWei,
} from 'common-util/functions';
import { useHelpers } from 'common-util/hooks/useHelpers';
import {
  depositServiceDonationRequest,
  getVeOlasThresholdRequest,
  minAcceptedEthRequest,
} from './requests';
import { DonateContainer } from './styles';

const { Title, Paragraph, Text } = Typography;

export const DepositServiceDonation = () => {
  const { account, chainId } = useHelpers();
  const [isLoading, setIsLoading] = useState(false);
  const [threshold, setThreshold] = useState(0);
  const [minAcceptedEth, setMinAcceptedEth] = useState(0);

  useEffect(() => {
    const getThresholdData = async () => {
      try {
        const response = await getVeOlasThresholdRequest({ chainId });
        setThreshold(response);

        const minEth = await minAcceptedEthRequest({ chainId });
        setMinAcceptedEth(minEth);
      } catch (error) {
        window.console.error(error);
        notifyError();
      }
    };

    if (chainId) {
      getThresholdData();
    }
  }, [chainId]);

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
      await depositServiceDonationRequest(params);

      notifySuccess('Deposited service donation successfully');
    } catch (error) {
      window.console.error(error);
      notifyError();
    } finally {
      setIsLoading(false);
    }
  };

  // const lastEpochCounter = await tokenomics.epochCounter() - 1;
  // const prevEpochPoint = await tokenomics.mapEpochTokenomics(lastEpochCounter);
  // const prevEpochEndTime = prevEpochPoint.endTime;
  // const epochLen = await tokenomics.epocLen();
  // const nextEpochEndTime = prevEpochEndTime + epochLen;

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
              To boost incentives of devs with freshly minted OLAS, you must
              hold at least&nbsp;
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
          isUnitTypeInput={false}
          inputOneLabel="Service ID"
          inputTwoLabel="Amount"
          buttonText="Add row"
          submitButtonText="Donate"
          isLoading={isLoading}
          onSubmit={onDepositServiceDonationSubmit}
        />
      </div>

      <div className="last-epoch-section">
        <Title level={2}>Last Epoch</Title>
      </div>
    </DonateContainer>
  );
};

/**
 * governance contract
 * token contract
 *
 * eg.
 * standard contract
 * we have olas toke, people can create governace => we can vote for/againt the proposal
 * but I don't have time to go through the => I can delegate my vote to someone else
 * who has time to go through the proposal
 *
 * local - setup
 *
 * bigger question -
 * - how does the proxy works ?
 * - we have token address, if we use the ABI (default erc20 ABI) to interact with the contract
 * (using the AAVE)
 *
 * - get the proxy contract address by actual contract address
 * - we need balanceOf & delegate
 *
 */
