import { useEffect, useState } from 'react';
import {
  Button, Form, InputNumber, Spin,
} from 'antd';
import pDebounce from 'p-debounce';
import { isNil, isNumber } from 'lodash';
import { notifyError } from '@autonolas/frontend-library';

import { useSvmConnectivity } from 'common-util/hooks/useSvmConnectivity';
import { useWithdrawTokenManagement } from './useTokenManagement';
import { DEFAULT_SLIPPAGE, slippageValidator } from './utils';

export const WsolWithDraw = () => {
  const [form] = Form.useForm();
  const [isEstimating, setIsEstimating] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [maxAmount, setMaxAmount] = useState(0);

  const { wallet, isSvmWalletConnected } = useSvmConnectivity();
  const {
    withdrawDecreaseLiquidity: fn,
    withdrawTransformedQuote,
    withdraw,
    getMaxAmount,
  } = useWithdrawTokenManagement();
  const decreaseLiquidity = pDebounce(fn, 500);

  // initially, set default slippage value
  useEffect(() => {
    form.setFieldsValue({ slippage: DEFAULT_SLIPPAGE });
  }, [form]);

  useEffect(() => {
    const tempMaxAmountFn = async () => {
      const tempAmount = await getMaxAmount();
      if (!isNil(tempAmount)) {
        setMaxAmount(tempAmount);
      }
    };

    if (isSvmWalletConnected) tempMaxAmountFn();
  }, [isSvmWalletConnected]);

  const onAmountAndSlippageChange = async () => {
    const amount = form.getFieldValue('amount');
    const slippage = form.getFieldValue('slippage');

    if (!isNumber(amount) || !isNumber(slippage)) return;

    try {
      setIsEstimating(true);
      const quote = await decreaseLiquidity({ amount, slippage });
      const transformedQuote = await withdrawTransformedQuote(quote);

      // update olas and wsol value
      form.setFieldsValue({
        olas: transformedQuote?.olasMin || null,
        wsol: transformedQuote?.wsolMin || null,
      });
    } catch (error) {
      notifyError('Failed to get estimated quote');
      console.error(error);
    } finally {
      setIsEstimating(false);
    }
  };

  const handleWithdraw = async () => {
    if (!isSvmWalletConnected) return;

    const amount = form.getFieldValue('amount');
    const slippage = form.getFieldValue('slippage');
    if (amount > maxAmount) {
      notifyError('Amount exceeds max');
      return;
    }

    try {
      setIsWithdrawing(true);
      await wallet.connect();

      await withdraw({ amount, slippage });
    } catch (error) {
      notifyError('Failed to withdraw');
      console.error(error);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const isMaxButtonDisabled = isEstimating || isWithdrawing || !isSvmWalletConnected || !maxAmount;
  const isWithdrawButtonDisabled = isEstimating || isWithdrawing || !isSvmWalletConnected;

  return (
    <Form
      form={form}
      name="withdraw-form"
      layout="vertical"
      className="mt-16"
      onFinish={handleWithdraw}
    >
      <Form.Item
        name="amount"
        rules={[{ required: true, message: 'Please input a valid amount' }]}
        label={(
          <>
            Amount
            <Button
              size="small"
              type="primary"
              ghost
              className="ml-8"
              disabled={isMaxButtonDisabled}
              onClick={() => form.setFieldsValue({ amount: maxAmount })}
            >
              Max
            </Button>
          </>
        )}
      >
        <InputNumber
          min={1}
          className="full-width"
          onChange={onAmountAndSlippageChange}
        />
      </Form.Item>

      <Form.Item
        name="slippage"
        label="Slippage"
        rules={[
          { required: true, message: 'Please input a valid slippage' },
          { validator: slippageValidator },
        ]}
      >
        <InputNumber
          min={0.01}
          suffix="%"
          className="full-width"
          onChange={onAmountAndSlippageChange}
        />
      </Form.Item>

      <Spin spinning={isEstimating} size="small">
        <Form.Item
          name="olas"
          label="OLAS"
          rules={[{ required: true, message: 'Please input a valid OLAS' }]}
        >
          <InputNumber disabled className="full-width" />
        </Form.Item>

        <Form.Item
          name="wsol"
          label="WSOL"
          rules={[{ required: true, message: 'Please input a valid WSOL' }]}
        >
          <InputNumber disabled className="full-width" />
        </Form.Item>
      </Spin>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          disabled={isWithdrawButtonDisabled}
        >
          Withdraw
        </Button>
      </Form.Item>
    </Form>
  );
};
