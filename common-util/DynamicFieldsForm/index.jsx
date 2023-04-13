import PropTypes from 'prop-types';
import { Button, Form, Typography } from 'antd/lib';
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
}) => {
  const { account } = useHelpers();
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    if (onSubmit) {
      await onSubmit({
        unitIds: values.units.map((unit) => unit.unitId),
        unitTypes: values.units.map((unit) => unit.unitType),
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
};

DynamicFieldsForm.defaultProps = {
  inputOneLabel: 'Unit ID',
  inputTwoLabel: 'Unit Type',
  buttonText: 'Add row',
  submitButtonText: 'Submit',
  isLoading: false,
  isUnitTypeInput: true,
};
