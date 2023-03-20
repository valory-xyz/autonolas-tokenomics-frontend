import React from 'react';
import PropTypes from 'prop-types';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button, Form, Input, InputNumber, Space,
} from 'antd/lib';
import styled from 'styled-components';

export const DynamicFormContainer = styled.div`
  max-width: 700px;
`;

export const FormList = ({ inputOneLabel, inputTwoLabel }) => (
  <Form.List
    name="units"
    rules={[
      {
        validator: async (_, units) => {
          if (!units || units?.length === 0) {
            return Promise.reject(new Error('At least 1 unit is required'));
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
              shouldUpdate={(prevValues, curValues) => prevValues.units !== curValues.units}
            >
              {() => (
                <Form.Item
                  {...field}
                  label={inputOneLabel}
                  name={[field.name, 'unitId']}
                  rules={[
                    { required: true, message: `Please add ${inputOneLabel}` },
                  ]}
                >
                  <InputNumber style={{ width: 200, marginRight: 32 }} />
                </Form.Item>
              )}
            </Form.Item>

            <Form.Item
              {...field}
              label={inputTwoLabel}
              name={[field.name, 'unitType']}
              rules={[
                { required: true, message: `Please add ${inputTwoLabel}` },
              ]}
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
);

FormList.propTypes = {
  inputOneLabel: PropTypes.string.isRequired,
  inputTwoLabel: PropTypes.string.isRequired,
};
