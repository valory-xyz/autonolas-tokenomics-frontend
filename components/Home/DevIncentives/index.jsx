import { Typography } from 'antd/lib';
import { ClaimIncentives } from './ClaimIncentives';
import { CheckIncentives } from './CheckIncentives';
import { MapIncentives } from './MapPendingIncentives';
import { Checkpoint } from './Checkpoint';

const { Title, Paragraph } = Typography;

export const DevIncentives = () => (
  <div>
    <Title level={2}>Dev Incentives</Title>
    <Paragraph style={{ maxWidth: 550 }}>
      The protocol rewards developers who contribute useful units of code. Units
      can be agents or components. Check available incentives and claim them if
      you have any outstanding.
    </Paragraph>

    <CheckIncentives />
    <br />
    <br />

    <Checkpoint />

    <ClaimIncentives />
    <br />
    <br />

    <MapIncentives />
  </div>
);
