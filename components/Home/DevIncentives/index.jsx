import { Typography } from 'antd/lib';
import { ClaimIncentives } from './ClaimIncentives';
import { CheckIncentives } from './IncentivesForThisEpoch';
import { MapIncentives } from './IncentivesForNextEpoch';
import { Checkpoint } from './Checkpoint';

const { Title, Paragraph } = Typography;

export const DevIncentives = () => (
  <div>
    <Title level={2}>Claimable Dev Incentives</Title>
    <Paragraph style={{ maxWidth: 550 }}>
      The protocol rewards developers who contribute useful units of code. Units
      can be agents or components. Check available incentives and claim them if
      you have any outstanding.
    </Paragraph>

    <CheckIncentives />
    <br />
    <br />

    <MapIncentives />
    <br />
    <br />

    <Checkpoint />

    <ClaimIncentives />

  </div>
);
