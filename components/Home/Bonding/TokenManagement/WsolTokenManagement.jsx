import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button, Modal, Flex, Tabs,
} from 'antd';

import { SolanaWallet } from 'common-util/Login/SolanaWallet';
// import { useSvmConnectivity } from 'common-util/hooks/useSvmConnectivity';
import { WsolDeposit } from './WsolDeposit';
import { WsolWithDraw } from './WsolWithdraw';

export const WsolTokenManagement = ({ lpToken, lpTokenLink }) => {
  const [isManageModalVisible, setIsManageModalVisible] = useState(false);
  // const { isSvmWalletConnected } = useSvmConnectivity();

  return (
    <>
      <Flex justify="space-between" align="center" gap={12}>
        <a href={lpTokenLink} target="_blank" rel="noreferrer">
          {lpToken}
        </a>
        <Button
          type="primary"
          // disabled={!isSvmWalletConnected}
          onClick={() => setIsManageModalVisible(true)}
        >
          Manage
        </Button>
      </Flex>

      <Modal
        title="Manage OLAS-WSOL LP Tokens"
        open={isManageModalVisible}
        onCancel={() => setIsManageModalVisible(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Tabs
          defaultActiveKey="1"
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
      </Modal>
    </>
  );
};

WsolTokenManagement.propTypes = {
  lpToken: PropTypes.string,
  lpTokenLink: PropTypes.string,
};

WsolTokenManagement.defaultProps = {
  lpToken: 0,
  lpTokenLink: '',
};
