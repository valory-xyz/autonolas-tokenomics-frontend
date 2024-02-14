import { useEffect, useState } from 'react';
import {
  Button, Form, InputNumber, Flex, Typography, Spin,
} from 'antd';
import pDebounce from 'p-debounce';
import { isNumber } from 'lodash';
import {
  getCommaSeparatedNumber,
  notifyError,
} from '@autonolas/frontend-library';

import { useSvmConnectivity } from 'common-util/hooks/useSvmConnectivity';
import { useDepositTokenManagement } from './useTokenManagement';
import { DEFAULT_SLIPPAGE, slippageValidator } from './utils';

const { Text } = Typography;
export const WsolDeposit = () => {
  const [form] = Form.useForm();
  const [estimatedQuote, setEstimatedQuote] = useState(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);

  const { isSvmWalletConnected } = useSvmConnectivity();

  const {
    depositIncreaseLiquidityQuote: fn,
    depositTransformedQuote,
    deposit,
  } = useDepositTokenManagement();
  const getDepositQuote = pDebounce(fn, 500);

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
      const quote = await getDepositQuote({ slippage, wsol });
      const transformedQuote = await depositTransformedQuote(quote);
      setEstimatedQuote(transformedQuote);

      // update olas value
      form.setFieldsValue({ olas: transformedQuote?.olasMax || null });
    } catch (error) {
      notifyError('Failed to get estimated quote');
      console.error(error);
    } finally {
      setIsEstimating(false);
    }
  };

  const handleDeposit = async () => {
    try {
      setIsDepositing(true);
      // await wallet.connect();

      // const balance = await connection.getBalance(wallet.publicKey);
      // const lamportBalance = balance / LAMPORTS_PER_SOL;
      // console.log({ lamportBalance });

      const wsol = form.getFieldValue('wsol');
      const slippage = form.getFieldValue('slippage');

      await deposit({ slippage, wsol });
    } catch (error) {
      notifyError('Failed to deposit');
      console.error(error);
    } finally {
      setIsDepositing(false);
    }
  };

  const isDepositButtonDisabled = isEstimating || isDepositing || !isSvmWalletConnected;
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
          { validator: slippageValidator },
        ]}
      >
        <InputNumber
          min={0}
          step={0.01}
          disabled={isEstimating}
          suffix="%"
          className="full-width"
          onChange={onWsolAndSlippageChange}
        />
      </Form.Item>

      <Form.Item>
        <Spin spinning={isEstimating} size="small">
          <Flex vertical gap="small" className="mb-16">
            <Text strong>ESTIMATED OUTPUT</Text>
            <Text>{estimatedOutput}</Text>
          </Flex>
        </Spin>

        <Button
          type="primary"
          htmlType="submit"
          disabled={isDepositButtonDisabled}
        >
          Deposit
        </Button>
      </Form.Item>
    </Form>
  );
};
