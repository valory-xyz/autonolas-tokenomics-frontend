import { Button, Form, Input } from 'antd/lib';
import styled from 'styled-components';
import { parseToWei } from 'common-util/functions';
import { useHelpers } from 'common-util/hooks/useHelpers';
import {
  depositRequest,
  hasSufficientTokenRequest,
  approveRequest,
} from './requests';

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

    // TODO: check for the allowance of the token,
    // if allownace in lower than the amount to be deposited,
    // then open the approve function
    // eg. If user is depositing 1000 OLAS and the allowance is 500, then open the approve function

    if (!hasSufficientAllowance) {
      // open approve modal
      await approveRequest({
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
