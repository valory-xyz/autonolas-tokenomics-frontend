import { Typography } from 'antd/lib';
import { ClaimIncentives } from './ClaimIncentives';
import { GetIncentives } from './GetIncentives';
import { MapIncentives } from './MapPendingIncentives';

const { Title, Paragraph } = Typography;

export const DevIncentives = () => (
  <div>
    <Title level={2}>Dev Incentives</Title>
    <Paragraph style={{ maxWidth: 550 }}>
      The protocol rewards developers who contribute useful units of code. Units
      can be agents or components. Check available incentives and claim them if
      you have any outstanding.
    </Paragraph>

    <GetIncentives />
    <br />
    <br />
    <ClaimIncentives />

    <br />
    <br />
    <MapIncentives />
  </div>
);
