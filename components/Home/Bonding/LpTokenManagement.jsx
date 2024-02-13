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
import { isNumber } from 'lodash';
import {
  getCommaSeparatedNumber,
  notifyError,
} from '@autonolas/frontend-library';

// import { SolanaWallet } from 'common-util/Login/SolanaWallet';
import {
  //  useAnchorWallet,
  // useConnection,
  useWallet,
} from '@solana/wallet-adapter-react';
// import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useTokenManagement } from './lpTokenManageUtils';

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
    increaseLiquidity: fn,
    deposit,
    getTransformedQuote,
  } = useTokenManagement();
  const increaseLiquidity = pDebounce(fn, 500);

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
      const transformedQuote = await getTransformedQuote(quote);
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
  // const [estimatedQuote, setEstimatedQuote] = useState(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // const anchorWallet = useAnchorWallet();
  const wallet = useWallet();
  // const { connection } = useConnection();

  const {
    withdrawDecreaseLiquidity: fn,
    withdrawTransformedQuote,
    deposit,
  } = useTokenManagement();
  const decreaseLiquidity = pDebounce(fn, 500);

  // initially, set default slippage value
  useEffect(() => {
    form.setFieldsValue({ slippage: DEFAULT_SLIPPAGE });
  }, [form]);

  const onAmountAndSlippageChange = async () => {
    const amount = form.getFieldValue('amount');
    const slippage = form.getFieldValue('slippage');

    if (!isNumber(amount) || !isNumber(slippage)) return;

    try {
      setIsEstimating(true);
      const quote = await decreaseLiquidity({ amount, slippage });
      const transformedQuote = await withdrawTransformedQuote(quote);
      // setEstimatedQuote(transformedQuote);

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
    try {
      setIsWithdrawing(true);
      await wallet.connect();

      const amount = form.getFieldValue('amount');
      const slippage = form.getFieldValue('slippage');
      await deposit({ amount, slippage });
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
        label="Amount"
        rules={[{ required: true, message: 'Please input a valid amount' }]}
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

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          disabled={isEstimating || isWithdrawing}
        >
          Withdraw
        </Button>
      </Form.Item>

      {/* <br /> */}
      {/* <SolanaWallet /> */}
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
