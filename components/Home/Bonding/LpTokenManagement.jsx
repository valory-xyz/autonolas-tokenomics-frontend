import { useEffect, useState } from 'react';
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
import { isNil, isNumber } from 'lodash';
import {
  getCommaSeparatedNumber,
  notifyError,
} from '@autonolas/frontend-library';
// import { LAMPORTS_PER_SOL } from '@solana/web3.js';

import { SolanaWallet } from 'common-util/Login/SolanaWallet';
import { useSvmConnectivity } from 'common-util/hooks/useSvmConnectivity';
import {
  useDepositTokenManagement,
  useWithdrawTokenManagement,
} from './lpTokenManageUtils';

const {
  // Paragraph,
  Text,
} = Typography;

const DEFAULT_SLIPPAGE = 1; // default value of 1 to slippage and user can change it

const slippageValidator = (_, value) => {
  if (value < 0 || value > 100) {
    return Promise.reject(new Error('Slippage must be between 0 and 100'));
  }

  return Promise.resolve();
};

const DepositForm = () => {
  const [form] = Form.useForm();
  const [estimatedQuote, setEstimatedQuote] = useState(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);

  // const anchorWallet = useAnchorWallet();
  // const wallet = useWallet();
  // const { connection } = useConnection();

  const {
    depositIncreaseLiquidity: fn,
    depositTransformedQuote,
    deposit,
  } = useDepositTokenManagement();
  const depositIncreaseLiquidity = pDebounce(fn, 500);

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
      const quote = await depositIncreaseLiquidity({ slippage, wsol });
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

      console.log('handle --- >>>>  1111 ');
      await deposit({ slippage, wsol });
    } catch (error) {
      notifyError('Failed to deposit');
      console.error(error);
    } finally {
      setIsDepositing(false);
    }
    console.log('handle --- >>>>  3333 ');
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
          disabled={isEstimating}
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

        <Button
          type="primary"
          htmlType="submit"
          disabled={isEstimating || isDepositing}
        >
          Deposit
        </Button>
      </Form.Item>

      {/* <br /> */}
      {/* <SolanaWallet /> */}
    </Form>
  );
};

const WithDraw = () => {
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
              disabled={
                !isSvmWalletConnected
                || isWithdrawing
                || isEstimating
                || !maxAmount
              }
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
          disabled={isEstimating || isWithdrawing || !isSvmWalletConnected}
        >
          Withdraw
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
        width={600}
      >
        <Tabs
          defaultActiveKey="1"
          tabBarExtraContent={<SolanaWallet />}
          items={[
            {
              key: 'deposit',
              label: 'Deposit',
              children: <DepositForm />,
            },
            {
              key: 'withdraw',
              label: 'Withdraw',
              children: <WithDraw />,
            },
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
