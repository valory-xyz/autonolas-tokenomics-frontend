import PropTypes from 'prop-types';
import {
  Button, Form, InputNumber, Space, Radio, Typography,
} from 'antd/lib';
import {
  MinusCircleOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

export const FormList = ({
  inputOneLabel,
  inputTwoLabel,
  buttonText,
  isUnitTypeInput,
}) => (
  <Form.List
    name="units"
    initialValue={[{ unitId: undefined, unitType: undefined }]}
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
                  <InputNumber min={0} className="mr-32" placeholder="Eg. 1" />
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
              {isUnitTypeInput ? (
                <Radio.Group>
                  <Radio value="0">Agent</Radio>
                  <Radio value="1">Component</Radio>
                </Radio.Group>
              ) : (
                <InputNumber min={0} placeholder="Eg. 5" />
              )}
            </Form.Item>

            {fields.length > 1 && (
              <MinusCircleOutlined onClick={() => remove(field.name)} />
            )}
          </Space>
        ))}

        <Form.ErrorList errors={errors} />

        <div>
          <Text type="secondary">
            <QuestionCircleOutlined />
            &nbsp;
            {inputOneLabel}
            &nbsp;should be in ascending order
          </Text>
        </div>

        <Form.Item wrapperCol={{ span: 6 }}>
          <Button onClick={() => add()} block icon={<PlusOutlined />}>
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
  isUnitTypeInput: PropTypes.bool.isRequired,
};
