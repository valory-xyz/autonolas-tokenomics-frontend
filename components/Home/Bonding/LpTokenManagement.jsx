import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Form,
  Input,
  Modal,
  InputNumber,
  Flex,
  Typography,
} from 'antd';

const { Paragraph, Text } = Typography;

export const LpTokenManagement = ({ lpToken, lpTokenLink }) => {
  const [form] = Form.useForm();
  const [isManageModalVisible, setIsManageModalVisible] = useState(true);

  useEffect(() => {
    // default value of 1 to slippage and user can change it
    form.setFieldsValue({ slippage: 1 });
  }, [form]);

  const onWsolBlur = () => {};

  const handleDeposit = () => {
    console.log('Deposit');
  };

  return (
    <>
      <Flex justify="space-between" align="center">
        <a href={lpTokenLink} target="_blank" rel="noreferrer">
          {lpToken}
        </a>
        <Button type="primary" onClick={() => setIsManageModalVisible(true)}>
          Manage
        </Button>
      </Flex>

      <Modal
        title="Manage OLAS-WSOL LP Tokens"
        open={isManageModalVisible}
        onCancel={() => setIsManageModalVisible(false)}
        footer={null}
        // footer={[
        //   <Button key="submit" type="primary" onClick={handleDeposit}>
        //     Deposit
        //   </Button>,
        // ]}
      >
        <Form
          form={form}
          name="manage"
          layout="vertical"
          onFinish={handleDeposit}
        >
          <Form.Item
            name="wsol"
            label="WSOL"
            rules={[
              {
                required: true,
                message: 'Please input a valid amount of WSOL',
              },
            ]}
          >
            <InputNumber min={0} className="full-width" />
          </Form.Item>

          <Form.Item
            name="olas"
            label="OLAS"
            rules={[
              {
                required: true,
                message: 'Please input a valid amount of OLAS',
              },
            ]}
          >
            <InputNumber disabled className="full-width" />
          </Form.Item>

          <Form.Item
            name="slippage"
            label="Slippage"
            rules={[
              {
                required: true,
                message: 'Please input a valid amount of slippage',
              },
            ]}
          >
            <InputNumber min={0} step={0.01} className="full-width" />
          </Form.Item>

          <Form.Item>
            <Flex vertical gap="small" className="mb-16">
              <Text>ESTIMATED OUTPUT</Text>
              <Text>LP Tokens</Text>
            </Flex>

            <Button type="primary" htmlType="submit">
              Deposit
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

LpTokenManagement.propTypes = {
  lpToken: PropTypes.string,
  lpTokenLink: PropTypes.string,
};

LpTokenManagement.defaultProps = {
  lpToken: 0,
  lpTokenLink: '',
};
