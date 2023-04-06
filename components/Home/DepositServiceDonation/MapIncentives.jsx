import { useState } from 'react';
// import PropTypes from 'prop-types';
import {
  Radio,
  Form,
  Button,
  InputNumber,
  Typography,
  Row,
  Col,
  Table,
} from 'antd/lib';
import { notifyError, parseToEth } from 'common-util/functions';
import { useHelpers } from 'common-util/hooks/useHelpers';
import { getMapUnitIncentivesRequest } from './requests';
// import { DynamicFormContainer } from "./styles";

const { Title } = Typography;

const columns = [
  {
    title: 'Pending Relative Reward',
    dataIndex: 'pendingRelativeReward',
    key: 'pendingRelativeReward',
  },
  {
    title: 'Pending Relative Topup',
    dataIndex: 'pendingRelativeTopUp',
    key: 'pendingRelativeTopUp',
  },
];

export const MapIncentives = () => {
  const { chainId } = useHelpers();
  const [isLoading, setIsLoading] = useState(false);
  const [pendingIncentives, setPendingIncentives] = useState([]);

  const [form] = Form.useForm();

  const onFinish = async (values) => {
    try {
      setIsLoading(true);

      const response = await getMapUnitIncentivesRequest({
        chainId,
        unitType: values.unitType,
        codeId: `${values.codeId}`,
      });
      setPendingIncentives([
        {
          pendingRelativeReward: parseToEth(response.pendingRelativeReward),
          pendingRelativeTopUp: parseToEth(response.pendingRelativeTopUp),
        },
      ]);
    } catch (error) {
      window.console.error(error);
      notifyError();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Title level={2}>Map Incentives</Title>

      <Row>
        <Col lg={14} xs={24}>
          <Form
            form={form}
            name="dynamic_form_complex"
            onFinish={onFinish}
            layout="inline"
            autoComplete="off"
          >
            <Form.Item
              label="Unit Type"
              name="unitType"
              rules={[{ required: true, message: 'Please add unit type' }]}
            >
              <Radio.Group>
                <Radio value="0">Agent</Radio>
                <Radio value="1">Component</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              label="Code ID"
              name="codeId"
              rules={[{ required: true, message: 'Please add codeId' }]}
            >
              <InputNumber min={0} className="mr-32" placeholder="Eg. 1" />
            </Form.Item>

            <Form.Item wrapperCol={{ span: 6 }}>
              <Button type="primary" htmlType="submit" loading={isLoading}>
                Get Incentives
              </Button>
            </Form.Item>
          </Form>
        </Col>

        <Col lg={10} xs={24}>
          {pendingIncentives.length > 0 && (
            <Table
              columns={columns}
              dataSource={pendingIncentives}
              bordered
              style={{ width: '500px' }}
              pagination={false}
            />
          )}
        </Col>
      </Row>
    </>
  );
};

// MapIncentives.propTypes = {};

// MapIncentives.defaultProps = {};
