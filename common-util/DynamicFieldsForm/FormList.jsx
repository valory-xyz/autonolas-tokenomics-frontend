import PropTypes from 'prop-types';
import {
  MinusCircleOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import {
  Button, Form, InputNumber, Space,
} from 'antd/lib';

export const FormList = ({ inputOneLabel, inputTwoLabel, buttonText }) => (
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
                  <InputNumber className="mr-32" />
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
              <InputNumber />
            </Form.Item>

            <MinusCircleOutlined onClick={() => remove(field.name)} />
          </Space>
        ))}

        {/* show error above the "Add Unit" button */}
        <Form.ErrorList errors={errors} />

        <Form.Item
          extra={(
            <>
              {/* antd icon for question mark */}
              <QuestionCircleOutlined />
              &nbsp;
              {inputOneLabel}
              &nbsp;should be in ascending order
            </>
          )}
        >
          <Button
            type="dashed"
            onClick={() => add()}
            block
            icon={<PlusOutlined />}
          >
            {buttonText}
          </Button>
        </Form.Item>
      </>
    )}
  </Form.List>
);

FormList.propTypes = {
  inputOneLabel: PropTypes.string.isRequired,
  inputTwoLabel: PropTypes.string.isRequired,
  buttonText: PropTypes.string.isRequired,
};
