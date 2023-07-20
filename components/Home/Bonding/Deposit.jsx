import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { isNil } from 'lodash';
import {
  Form,
  InputNumber,
  Modal,
  Alert,
  Button,
  Typography,
  Tag,
} from 'antd/lib';
import { COLOR } from '@autonolas/frontend-library';

import {
  parseToWei,
  notifySuccess,
  notifyError,
  parseToEth,
  getCommaSeparatedNumber,
} from 'common-util/functions';
import { useHelpers } from 'common-util/hooks/useHelpers';
import {
  depositRequest,
  hasSufficientTokenRequest,
  approveRequest,
  getLpBalanceRequest,
} from './requests';

const { Text, Title } = Typography;
const fullWidth = { width: '100%' };

export const Deposit = ({
  productId,
  productToken,
  productLpPrice,
  getProducts,
  closeModal,
}) => {
  const { account, chainId } = useHelpers();
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [isApproveModalVisible, setIsApproveModalVisible] = useState(false);
  const [lpBalance, setLpBalance] = useState(0);

  useEffect(async () => {
    if (account) {
      const lpResponse = await getLpBalanceRequest({
        account,
        token: productToken,
      });

      // console.log({
      //   lpTokenInWei: lpResponse,
      //   lpBalance: parseToEth(lpResponse),
      // });
      setLpBalance(parseToEth(lpResponse));
    }
  }, [account, productToken]);

  const depositHelper = async () => {
    try {
      setIsLoading(true);

      // deposit if LP token is present for the product ID
      const txHash = await depositRequest({
        account,
        productId,
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
        // console.log({
        //   inputValue: values.tokenAmount,
        //   parsedToWei: parseToWei(values.tokenAmount),
        // });
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

  const tokenAmountInputValue = Form.useWatch('tokenAmount', form);

  const getOlasPayout = () => {
    if (!tokenAmountInputValue) return '--';
    if (tokenAmountInputValue > lpBalance) return '--';

    const olasPayout = tokenAmountInputValue
      ? productLpPrice * tokenAmountInputValue
      : 0;
    return getCommaSeparatedNumber(olasPayout, 4);
  };

  return (
    <>
      <Modal
        open
        title="Bond LP tokens for OLAS"
        okText="Bond"
        okButtonProps={{
          disabled: !account || lpBalance === 0,
        }}
        cancelText="Cancel"
        onCancel={closeModal}
        onOk={onCreate}
        confirmLoading={isLoading}
        destroyOnClose
      >
        <Form
          form={form}
          name="create_bond_form"
          layout="vertical"
          autoComplete="off"
        >
          <Tag color={COLOR.PRIMARY} className="deposit-tag">
            <Title level={5} className="m-0">
              {`Bonding Product ID: ${productId}`}
            </Title>
          </Tag>

          <Form.Item
            className="custom-form-item-tokenAmount"
            label="LP Token Amount"
            name="tokenAmount"
            rules={[
              { required: true, message: 'Please input a valid amount' },
              () => ({
                validator(_, value) {
                  if (value === '' || isNil(value)) return Promise.resolve();
                  if (value <= 0) {
                    return Promise.reject(
                      new Error('Please input a valid amount'),
                    );
                  }
                  if (value > lpBalance) {
                    return Promise.reject(
                      new Error('Amount cannot be greater than the balance'),
                    );
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <InputNumber style={fullWidth} />
          </Form.Item>

          <div className="mb-8">
            <Text type="secondary">
              LP balance:&nbsp;
              {getCommaSeparatedNumber(lpBalance, 4)}
              <Button
                htmlType="button"
                type="link"
                onClick={() => {
                  form.setFieldsValue({ tokenAmount: lpBalance });
                  form.validateFields(['tokenAmount']);
                }}
                className="pl-0"
              >
                Max
              </Button>
            </Text>
          </div>

          <div>
            <Text>{`OLAS Payout: ${getOlasPayout()}`}</Text>
          </div>
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
            message="Before depositing to the bonding product, an approval for OLAS is required. Please approve OLAS to proceed."
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
  productLpPrice: PropTypes.number,
  closeModal: PropTypes.func,
  getProducts: PropTypes.func,
};

Deposit.defaultProps = {
  productId: undefined,
  productToken: null,
  productLpPrice: null,
  closeModal: () => {},
  getProducts: () => {},
};
