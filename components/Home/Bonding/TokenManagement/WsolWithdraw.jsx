import { useEffect, useState } from 'react';
import {
  Button, Form, InputNumber, Spin,
} from 'antd';
import pDebounce from 'p-debounce';
import { isNil, isNumber } from 'lodash';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { notifyError, notifySuccess } from '@autonolas/frontend-library';

import { useSvmConnectivity } from 'common-util/hooks/useSvmConnectivity';
import { useWsolWithdraw } from './hooks/useWsolWithdraw';
import { DEFAULT_SLIPPAGE, slippageValidator } from './utils';

export const WsolWithDraw = () => {
  const [form] = Form.useForm();
  const [isEstimating, setIsEstimating] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [maxAmount, setMaxAmount] = useState(0);

  const { isSvmWalletConnected } = useSvmConnectivity();
  const {
    withdrawDecreaseLiquidityQuote: fn,
    withdrawTransformedQuote,
    withdraw,
    getMaxAmount,
  } = useWsolWithdraw();
  const getDecreaseLiquidityQuote = pDebounce(fn, 500);

  // initially, set default slippage value
  useEffect(() => {
    form.setFieldsValue({ slippage: DEFAULT_SLIPPAGE });
  }, [form]);

  useEffect(() => {
    const setMaxAmountFn = async () => {
      const tempAmount = await getMaxAmount();
      if (!isNil(tempAmount)) {
        setMaxAmount(tempAmount / LAMPORTS_PER_SOL);
      }
    };

    if (isSvmWalletConnected) setMaxAmountFn();
  }, [isSvmWalletConnected, getMaxAmount]);

  const onAmountAndSlippageChange = async () => {
    const amount = form.getFieldValue('amount');
    const slippage = form.getFieldValue('slippage');

    if (!isNumber(amount) || !isNumber(slippage)) return;

    try {
      setIsEstimating(true);
      const quote = await getDecreaseLiquidityQuote({ amount, slippage });
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

  const onMaxClick = () => {
    form.setFieldsValue({ amount: maxAmount });
    onAmountAndSlippageChange();
  };

  const handleWithdraw = async () => {
    if (!isSvmWalletConnected) {
      notifyError('Please connect your wallet');
      return;
    }

    const amount = form.getFieldValue('amount');
    const slippage = form.getFieldValue('slippage');
    if (amount > maxAmount) {
      notifyError('Amount exceeds the maximum limit');
      return;
    }

    try {
      setIsWithdrawing(true);

      const actualAmount = amount * LAMPORTS_PER_SOL;
      await withdraw({ amount: actualAmount, slippage });
      notifySuccess('Withdraw successful');

      // reset form fields after successful withdraw
      form.setFieldsValue({
        amount: undefined,
        slippage: DEFAULT_SLIPPAGE,
        olas: undefined,
        wsol: undefined,
      });
    } catch (error) {
      notifyError('Failed to withdraw');
      console.error(error);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const isMaxButtonDisabled = isEstimating || isWithdrawing || !isSvmWalletConnected;
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
        rules={[
          { required: true, message: 'Please input a valid amount' },
          {
            validator: (_, value) => {
              if (!isSvmWalletConnected) return Promise.resolve();

              if (value > maxAmount) {
                return Promise.reject(
                  new Error('Amount cannot exceed the maximum limit'),
                );
              }

              return Promise.resolve();
            },
          },
        ]}
        label={(
          <>
            Bridged Tokens Amount
            <Button
              size="small"
              type="primary"
              ghost
              className="ml-8"
              disabled={isMaxButtonDisabled}
              onClick={onMaxClick}
            >
              Max
            </Button>
          </>
        )}
      >
        <InputNumber
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
          loading={isWithdrawing}
          disabled={isWithdrawButtonDisabled}
        >
          Withdraw
        </Button>
      </Form.Item>
    </Form>
  );
};
