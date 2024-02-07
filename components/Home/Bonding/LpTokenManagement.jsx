/* eslint-disable camelcase */
import {
  use, useCallback, useEffect, useState,
} from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Form,
  // Input,
  Modal,
  InputNumber,
  Flex,
  Typography,
  Tabs,
  Spin,
} from 'antd';
// import { NA } from '@autonolas/frontend-library';
import pDebounce from 'p-debounce';
import { isNumber } from 'lodash';
import {
  getCommaSeparatedNumber,
  notifyError,
} from '@autonolas/frontend-library';

import { useDepositEstimation } from './lpTokenManageUtils';

const {
  // Paragraph,
  Text,
} = Typography;

const DEFAULT_SLIPPAGE = 1; // default value of 1 to slippage and user can change it

const DepositForm = () => {
  const [form] = Form.useForm();
  const [estimatedQuote, setEstimatedQuote] = useState(null);
  const [isEstimating, setIsEstimating] = useState(false);

  const increaseLiquidityFn = useDepositEstimation();
  const increaseLiquidity = pDebounce(increaseLiquidityFn, 500);

  // initially, set default slippage value
  useEffect(() => {
    form.setFieldsValue({ slippage: DEFAULT_SLIPPAGE });
  }, [form]);

  const onWsolAndSlippageChange = async () => {
    const wsol = form.getFieldValue('wsol');
    const slippage = form.getFieldValue('slippage');

    if (!isNumber(wsol) || !isNumber(slippage)) return;

    try {
      setIsEstimating(true);
      const quote = await increaseLiquidity({ slippage, wsol });
      setEstimatedQuote(quote);

      // update olas value
      form.setFieldsValue({ olas: quote?.olasMax || null });
    } catch (error) {
      notifyError('Failed to get estimated quote');
      console.error(error);
    } finally {
      setIsEstimating(false);
    }
  };

  const handleDeposit = () => {
    // console.log('Deposit');
  };

  const estimatedOutput = `${
    getCommaSeparatedNumber(estimatedQuote?.liquidity) || '--'
  } LP Tokens`;

  return (
    <Form
      form={form}
      name="manage"
      layout="vertical"
      className="mt-16"
      onFinish={handleDeposit}
    >
      <Form.Item
        name="wsol"
        label="WSOL"
        rules={[
          { required: true, message: 'Please input a valid amount of WSOL' },
        ]}
      >
        <InputNumber
          min={0}
          className="full-width"
          onChange={onWsolAndSlippageChange}
        />
      </Form.Item>

      <Form.Item
        name="olas"
        label="OLAS"
        rules={[
          { required: true, message: 'Please input a valid amount of OLAS' },
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
          // {
          //   validator: (_, value) => {
          //     if (value < 0 || value > 100) {
          //       return Promise.reject(
          //         new Error('Slippage must be between 0 and 100'),
          //       );
          //     }

          //     // if (value.toString().split('.')[1]?.length > 2) {
          //     //   return Promise.reject(
          //     //     new Error('Slippage must be at most 2 decimal places'),
          //     //   );
          //     // }
          //     return Promise.resolve();
          //   },
          // },
        ]}
      >
        <InputNumber
          min={0}
          step={0.01}
          // precision={2}
          suffix="%"
          className="full-width"
          onChange={onWsolAndSlippageChange}
          // onChange={(e) => onWsolAndSlippageChange(Number((e || 0).toFixed(2)))}
        />
      </Form.Item>

      <Form.Item>
        <Spin spinning={isEstimating} size="small">
          <Flex vertical gap="small" className="mb-16">
            <Text strong>ESTIMATED OUTPUT</Text>
            <Text>{estimatedOutput}</Text>
          </Flex>
        </Spin>

        <Button type="primary" htmlType="submit">
          Deposit
        </Button>
      </Form.Item>
    </Form>
  );
};

export const LpTokenManagement = ({ lpToken, lpTokenLink }) => {
  const [isManageModalVisible, setIsManageModalVisible] = useState(true);

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
      >
        <Tabs
          // TODO: fix the tab border in GlobalStyles
          defaultActiveKey="1"
          items={[
            {
              key: 'deposit',
              label: 'Deposit',
              children: <DepositForm />,
            },
            // {
            //   key: 'withdraw',
            //   label: 'Withdraw',
            //   disabled: true,
            //   children: null,
            // },
          ]}
        />
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
