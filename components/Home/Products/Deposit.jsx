import { Button, Form, Input } from 'antd/lib';
import styled from 'styled-components';
import { parseToWei } from 'common-util/functions';
import { useHelpers } from 'common-util/hooks/useHelpers';
import {
  depositRequest,
  hasSufficientTokenRequest,
  approveOlasByOwner,
} from '../contractUtils';

const Container = styled.div`
  width: 500px;
  margin-top: 2rem;
`;

export const Deposit = () => {
  const { account, chainId } = useHelpers();

  const onFinish = async (values) => {
    // check allowance of the product ID and open approve modal if not approved

    const hasSufficientAllowance = await hasSufficientTokenRequest({
      account,
      chainId,
      token: '0x073240f818dd606032956F709110656764008f58',
    });

    if (!hasSufficientAllowance) {
      // open approve modal
      await approveOlasByOwner({
        account,
        chainId,
        token: '0x073240f818dd606032956F709110656764008f58',
      });
    }

    // deposit if LP token is present for the product ID
    await depositRequest({
      account,
      chainId,
      productId: values.productId,
      tokenAmount: parseToWei(values.tokenAmount),
    });
  };

  return (
    <Container>
      <Form
        name="basic"
        onFinish={onFinish}
        autoComplete="off"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
      >
        <Form.Item
          label="Product ID"
          name="productId"
          rules={[{ required: true, message: 'Please input product ID' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Token Amount"
          name="tokenAmount"
          rules={[{ required: true, message: 'Please input token' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Button type="primary" htmlType="submit" disabled={!account}>
            Submit
          </Button>
        </Form.Item>
      </Form>
    </Container>
  );
};
