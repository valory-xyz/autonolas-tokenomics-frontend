import { Typography } from 'antd/lib';
import { ClaimIncentives } from './Incentives/ClaimIncentives';
import { GetIncentives } from './Incentives/GetIncentives';

const { Title, Paragraph, Text } = Typography;

export const OwnerIncentives = () => (
  <div>
    <Title level={2}>Owner Incentives</Title>
    <Paragraph style={{ maxWidth: 550 }}>
      Valory built the core technology behind Autonolas. The team is a VC-backed
      group of engineers, researchers and commercial thinkers.&nbsp;
      <a href="https://autonolas.network/" target="_blank" rel="noreferrer">
        <Text type="secondary" underline>
          Learn more
        </Text>
      </a>
    </Paragraph>

    <GetIncentives />
    <br />
    <br />
    <ClaimIncentives />
  </div>
);
