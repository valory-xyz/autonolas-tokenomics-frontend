import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button, Modal, Flex, Tabs, Tooltip,
} from 'antd';

import { SolanaWallet } from 'common-util/Login/SolanaWallet';
import { WsolDeposit } from './WsolDeposit';
import { WsolWithDraw } from './WsolWithdraw';

const IS_MANAGEMENT_ENABLED = true;

export const WsolTokenManagement = ({ lpToken, lpTokenLink }) => {
  const [isManageModalVisible, setIsManageModalVisible] = useState(false);
  const manageButton = (
    <Button
      type="primary"
      disabled={!IS_MANAGEMENT_ENABLED}
      onClick={() => setIsManageModalVisible(true)}
    >
      Manage
    </Button>
  );

  return (
    <>
      <Flex justify="space-between" align="center" gap={12}>
        <a href={lpTokenLink} target="_blank" rel="noreferrer">
          {lpToken}
        </a>
        {IS_MANAGEMENT_ENABLED ? (
          manageButton
        ) : (
          <Tooltip title="Coming soon">{manageButton}</Tooltip>
        )}
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
