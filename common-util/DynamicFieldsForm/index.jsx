import React from 'react';
import PropTypes from 'prop-types';
import { Button, Form } from 'antd/lib';
import styled from 'styled-components';
import { FormList } from './FormList';

export const DynamicFormContainer = styled.div`
  max-width: 700px;
`;

export const DynamicFieldsForm = ({ onSubmit }) => {
  const [form] = Form.useForm();
  const onFinish = (values) => {
    window?.console.log('Received values of form:', values);
    onSubmit({
      unitIds: values.units.map((unit) => unit.unitId),
      unitTypes: values.units.map((unit) => unit.unitType),
    });
  };

  return (
    <DynamicFormContainer>
      <Form
        form={form}
        name="dynamic_form_complex"
        onFinish={onFinish}
        autoComplete="off"
      >
        <FormList />

        <Form.Item>
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
        </Form.Item>
      </Form>
    </DynamicFormContainer>
  );
};

DynamicFieldsForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};

// DynamicFieldsForm.defaultProps = {
// };
