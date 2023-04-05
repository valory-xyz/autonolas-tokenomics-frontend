import { Typography } from 'antd/lib';
import { ClaimIncentives } from './Incentives/ClaimIncentives';
import { GetIncentives } from './Incentives/GetIncentives';

const { Title, Paragraph } = Typography;

export const OwnerIncentives = () => (
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
  </div>
);
