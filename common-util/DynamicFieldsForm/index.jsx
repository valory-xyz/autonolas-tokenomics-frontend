import PropTypes from 'prop-types';
import { Button, Form } from 'antd/lib';
import { FormList } from './FormList';
import { DynamicFormContainer } from './styles';

export const DynamicFieldsForm = ({
  inputOneLabel,
  inputTwoLabel,
  buttonText,
  isLoading,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const onFinish = async (values) => {
    window?.console.log('Received values of form:', values);
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
          inputOneLabel={inputOneLabel}
          inputTwoLabel={inputTwoLabel}
          buttonText={buttonText}
        />

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            Submit
          </Button>
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
  isLoading: PropTypes.bool,
};

DynamicFieldsForm.defaultProps = {
  inputOneLabel: 'Unit ID',
  inputTwoLabel: 'Unit Type',
  buttonText: 'Add Unit',
  isLoading: false,
};
