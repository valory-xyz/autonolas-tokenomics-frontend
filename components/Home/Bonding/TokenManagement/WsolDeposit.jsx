import { useEffect, useState } from 'react';
import {
  Button, Form, InputNumber, Flex, Typography, Spin, Alert,
} from 'antd';
import pDebounce from 'p-debounce';
import { isNumber } from 'lodash';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
  getCommaSeparatedNumber,
  notifyError,
} from '@autonolas/frontend-library';

import { useSvmConnectivity } from 'common-util/hooks/useSvmConnectivity';
import { useWsolDeposit } from './hooks/useWsolDeposit';
import { DEFAULT_SLIPPAGE, slippageValidator } from './utils';

const { Text } = Typography;

export const WsolDeposit = () => {
  const [form] = Form.useForm();
  const { isSvmWalletConnected } = useSvmConnectivity();
  const [estimatedQuote, setEstimatedQuote] = useState(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [bridgedTokenAmount, setBridgedTokenAmount] = useState(null);

  const {
    getDepositIncreaseLiquidityQuote: fn,
    getDepositTransformedQuote,
    deposit,
  } = useWsolDeposit();
  const getDepositQuote = pDebounce(fn, 500);

  useEffect(() => {
    // initially, set default slippage value
    form.setFieldsValue({ slippage: DEFAULT_SLIPPAGE });
  }, [form]);

  const onWsolAndSlippageChange = async () => {
    const wsol = form.getFieldValue('wsol');
    const slippage = form.getFieldValue('slippage');

    // estimate quote only if wsol and slippage are valid
    if (!isNumber(wsol) || !isNumber(slippage)) return;

    try {
      setIsEstimating(true);

      const quote = await getDepositQuote({ slippage, wsol });
      const transformedQuote = await getDepositTransformedQuote(quote);
      setEstimatedQuote(transformedQuote);

      // update olas value in form
      form.setFieldsValue({ olas: transformedQuote?.olasMax || null });
    } catch (error) {
      notifyError('Failed to estimate quote');
      console.error(error);
    } finally {
      setIsEstimating(false);
    }
  };

  const handleDeposit = async () => {
    try {
      setIsDepositing(true);

      const wsol = form.getFieldValue('wsol');
      const slippage = form.getFieldValue('slippage');

      const bridgedToken = await deposit({ slippage, wsol });
      if (Number(bridgedToken) > 0) {
        setBridgedTokenAmount(bridgedToken / LAMPORTS_PER_SOL);
      }
    } catch (error) {
      notifyError('Failed to deposit');
      console.error(error);
    } finally {
      setIsDepositing(false);
    }
  };

  const isDepositButtonDisabled = isEstimating || isDepositing || !isSvmWalletConnected;
  const estimatedOutput = getCommaSeparatedNumber(
    (estimatedQuote?.liquidity || 0) / LAMPORTS_PER_SOL,
  ) || '--';

  return (
    <>
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
              <Text>{`${estimatedOutput} Bridged Tokens`}</Text>
            </Flex>
          </Spin>

          <Button
            type="primary"
            htmlType="submit"
            loading={isDepositing}
            disabled={isDepositButtonDisabled}
          >
            Deposit
          </Button>
        </Form.Item>
      </Form>

      {bridgedTokenAmount && (
        <Alert
          message={(
            <>
              You received
              <Text strong>
                {` ${getCommaSeparatedNumber(
                  bridgedTokenAmount,
                )} Bridged Tokens`}
              </Text>
            </>
          )}
          type="success"
          showIcon
        />
      )}
    </>
  );
};
