import React from 'react';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button, Form, Input, InputNumber, Select, Space,
} from 'antd/lib';
import styled from 'styled-components';

export const DynamicFormContainer = styled.div`
  max-width: 700px;
`;

export const DynamicFieldsForm = () => {
  const [form] = Form.useForm();
  const onFinish = (values) => {
    console.log('Received values of form:', values);
  };
  const handleChange = () => {
    if (form.getFieldValue('units').length === 0) {
      return;
    }

    form.setFieldsValue({
      units: [],
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
        <Form.Item
          name="area"
          label="Area"
          rules={[{ required: true, message: 'Missing area' }]}
        >
          <Select
            options={[
              { label: 'Beijing', value: 'Beijing' },
              { label: 'Shanghai', value: 'Shanghai' },
            ]}
            onChange={handleChange}
          />
        </Form.Item>

        <Form.List
          name="units"
          rules={[
            {
              validator: async (_, units) => {
                if (!units || units?.length === 0) {
                  return Promise.reject(
                    new Error('At least 1 unit is required'),
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          {(fields, { add, remove }, { errors }) => (
            <>
              {fields.map((field) => (
                <Space key={field.key} align="baseline">
                  <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, curValues) => prevValues.area !== curValues.area
                      || prevValues.units !== curValues.units}
                  >
                    {() => (
                      <Form.Item
                        {...field}
                        label="Service ID"
                        name={[field.name, 'serviceId']}
                        rules={[
                          { required: true, message: 'Please add service ID' },
                        ]}
                      >
                        <InputNumber style={{ width: 200, marginRight: 32 }} />
                      </Form.Item>
                    )}
                  </Form.Item>

                  <Form.Item
                    {...field}
                    label="Amount"
                    name={[field.name, 'amount']}
                    rules={[{ required: true, message: 'Please add amount' }]}
                  >
                    <Input />
                  </Form.Item>

                  <MinusCircleOutlined onClick={() => remove(field.name)} />
                </Space>
              ))}

              {/* show error above the "Add Unit" button */}
              <Form.ErrorList errors={errors} />

              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                >
                  Add Unit
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
        </Form.Item>
      </Form>
    </DynamicFormContainer>
  );
};
