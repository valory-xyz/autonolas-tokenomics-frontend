import PropTypes from 'prop-types';
import {
  Button, Form, Typography, Input,
} from 'antd/lib';
import { FORM_TYPES } from 'util/constants';
import { useEffect } from 'react';
import { useHelpers } from '../hooks/useHelpers';
import { FormList } from './FormList';
import { DynamicFormContainer } from './styles';

const { Text } = Typography;

export const DynamicFieldsForm = ({
  isUnitTypeInput,
  inputOneLabel,
  inputTwoLabel,
  buttonText,
  isLoading,
  submitButtonText,
  onSubmit,
  dynamicFormType,
}) => {
  const { account } = useHelpers();
  const [form] = Form.useForm();

  useEffect(() => {
    if (account) {
      if (dynamicFormType === FORM_TYPES.CLAIMABLE_INCENTIVES) {
        form.setFieldsValue({ address: account });
      }
    }
  }, [account]);

  const onFinish = async (values) => {
    if (onSubmit) {
      await onSubmit({
        unitIds: values.units.map((unit) => unit.unitId),
        unitTypes: values.units.map((unit) => unit.unitType),
        address: values.address,
      });
    }
  };

  return (
    <DynamicFormContainer>
      <Form
        form={form}
        name="dynamic_form_complex"
        onFinish={onFinish}
        autoComplete="off"
      >
        {/* address input is only visible for claimable incentives */}
        {dynamicFormType === FORM_TYPES.CLAIMABLE_INCENTIVES && (
          <Form.Item
            label="Address"
            name="address"
            rules={[{ required: true, message: 'Please add address' }]}
          >
            <Input placeholder="Eg. 0x" />
          </Form.Item>
        )}

        <FormList
          isUnitTypeInput={isUnitTypeInput}
          inputOneLabel={inputOneLabel}
          inputTwoLabel={inputTwoLabel}
          buttonText={buttonText}
        />

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            disabled={!account}
          >
            {submitButtonText}
          </Button>

          {!account && (
            <Text className="ml-8" type="secondary">
              {`To ${(submitButtonText || '').toLowerCase()}, connect a wallet`}
            </Text>
          )}
        </Form.Item>
      </Form>
    </DynamicFormContainer>
  );
};

DynamicFieldsForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  inputOneLabel: PropTypes.string,
  inputTwoLabel: PropTypes.string,
  buttonText: PropTypes.string,
  submitButtonText: PropTypes.string,
  isLoading: PropTypes.bool,
  isUnitTypeInput: PropTypes.bool,
  dynamicFormType: PropTypes.string,
};

DynamicFieldsForm.defaultProps = {
  inputOneLabel: 'Unit ID',
  inputTwoLabel: 'Unit Type',
  buttonText: 'Add row',
  submitButtonText: 'Submit',
  isLoading: false,
  isUnitTypeInput: true,
  dynamicFormType: null,
};
