import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Form, Input, Modal, Alert, Button,
} from 'antd/lib';
import { parseToWei, notifySuccess, notifyError } from 'common-util/functions';
import { useHelpers } from 'common-util/hooks/useHelpers';
import {
  depositRequest,
  hasSufficientTokenRequest,
  approveRequest,
} from './requests';

export const Deposit = ({
  productId,
  productToken,
  getProducts,
  closeModal,
}) => {
  const { account, chainId } = useHelpers();
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [isApproveModalVisible, setIsApproveModalVisible] = useState(false);

  const depositHelper = async () => {
    try {
      setIsLoading(true);

      // deposit if LP token is present for the product ID
      const txHash = await depositRequest({
        account,
        chainId,
        productId: form.getFieldValue('productId'),
        tokenAmount: parseToWei(form.getFieldValue('tokenAmount')),
      });
      notifySuccess('Deposited successfully!', `Transaction Hash: ${txHash}`);

      // fetch the products details again
      getProducts();

      // close the modal after successful deposit
      closeModal();
      form.resetFields();
    } catch (error) {
      notifyError('Error while depositing');
      window.console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const onCreate = () => {
    form
      .validateFields()
      .then(async (values) => {
        // check allowance of the product ID and open approve modal if not approved
        const hasSufficientAllowance = await hasSufficientTokenRequest({
          account,
          chainId,
          token: productToken,
          tokenAmount: parseToWei(values.tokenAmount),
        });

        // if allowance in lower than the amount to be deposited, then needs approval
        // eg. If user is depositing 10 OLAS and the allowance is 5, then open the approve modal
        if (hasSufficientAllowance) {
          await depositHelper();
        } else {
          setIsApproveModalVisible(true);
        }
      })
      .catch((info) => {
        window.console.log('Validation Failed:', info);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <>
      <Modal
        visible
        title="Create Bond"
        okText="Create Bond"
        cancelText="Cancel"
        onCancel={closeModal}
        onOk={onCreate}
        confirmLoading={isLoading}
      >
        <Form
          form={form}
          name="create_bond_form"
          autoComplete="off"
          labelCol={{ span: 10 }}
          wrapperCol={{ span: 14 }}
          initialValues={{
            productId: productId || undefined,
          }}
        >
          <Form.Item
            label="Bonding Program ID"
            name="productId"
            rules={[{ required: true, message: 'Please input Bonding Program ID' }]}
          >
            <Input disabled />
          </Form.Item>

          <Form.Item
            label="Token Amount"
            name="tokenAmount"
            rules={[{ required: true, message: 'Please input token' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      {isApproveModalVisible && (
        <Modal
          title="Approve OLAS"
          visible={isApproveModalVisible}
          footer={null}
          onCancel={() => setIsApproveModalVisible(false)}
        >
          <Alert
            message="Before depositing an approval for OLAS is required, please approve to proceed"
            type="warning"
          />

          <br />
          <Button
            type="primary"
            htmlType="submit"
            style={{ right: 'calc(-100% + 100px)', position: 'relative' }}
            loading={isLoading}
            onClick={async () => {
              try {
                setIsLoading(true);
                await approveRequest({
                  account,
                  chainId,
                  token: productToken,
                });

                // once approved, close the modal and call deposit helper
                setIsApproveModalVisible(false);
                await depositHelper();
              } catch (error) {
                window.console.error(error);
                setIsApproveModalVisible(false);
                notifyError();
              } finally {
                setIsLoading(false);
              }
            }}
          >
            Approve
          </Button>
        </Modal>
      )}
    </>
  );
};

Deposit.propTypes = {
  productId: PropTypes.string,
  productToken: PropTypes.string,
  closeModal: PropTypes.func,
  getProducts: PropTypes.func,
};

Deposit.defaultProps = {
  productId: undefined,
  productToken: null,
  closeModal: () => {},
  getProducts: () => {},
};
