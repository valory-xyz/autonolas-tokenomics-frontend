import { useState } from 'react';
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
import { notifyError } from 'common-util/functions';
import { useHelpers } from 'common-util/hooks/useHelpers';
import { getMapUnitIncentivesRequest } from './requests';
import { MapPendingIncentivesContainer } from './styles';

const { Title } = Typography;

const columns = [
  {
    title: '',
    dataIndex: 'leftText',
    key: 'leftText',
    width: 180,
  },
  {
    title: 'Pending Reward',
    dataIndex: 'pendingRelativeReward',
    key: 'pendingRelativeReward',
  },
  {
    title: 'Pending Topup',
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
        unitId: `${values.unitId}`,
      });
      setPendingIncentives([
        { ...response, leftText: 'can be claimed during next epoch' },
      ]);
    } catch (error) {
      window.console.error(error);
      notifyError();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MapPendingIncentivesContainer>
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
              label="Unit ID"
              name="unitId"
              rules={[{ required: true, message: 'Please add unit Id' }]}
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
              pagination={false}
            />
          )}
        </Col>
      </Row>
    </MapPendingIncentivesContainer>
  );
};
