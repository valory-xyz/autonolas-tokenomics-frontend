import { Flex, Tabs, Card } from 'antd';

import { SolanaWallet } from 'common-util/Login/SolanaWallet';
import { WsolDeposit } from './WsolDeposit';
import { WsolWithDraw } from './WsolWithdraw';

export const WsolTokenManagement = () => {
  return (
    <Card style={{ width: '500px', margin: '0 auto' }}>
      <Flex justify="space-between" align="center" gap={12}>
        <Tabs
          className="full-width"
          defaultActiveKey="deposit"
          tabBarExtraContent={<SolanaWallet />}
          items={[
            {
              key: 'deposit',
              label: 'Deposit',
              children: <WsolDeposit />,
            },
            {
              key: 'withdraw',
              label: 'Withdraw',
              children: <WsolWithDraw />,
            },
          ]}
        />
      </Flex>
    </Card>
  );
};
