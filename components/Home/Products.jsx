import { useState } from 'react';
import { Typography, Switch } from 'antd/lib';
import { ProductList } from './Products/ProductList';
import { Deposit } from './Products/Deposit';

const { Title } = Typography;

export const Products = () => {
  const [isActiveProducts, setIsActiveProducts] = useState(true);

  return (
    <div>
      <Title level={2}>
        Products
        <Switch
          checked={isActiveProducts}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
          onChange={(checked) => setIsActiveProducts(checked)}
          className="ml-16"
        />
      </Title>

      <ProductList isActiveProducts={isActiveProducts} />
      <Deposit />
    </div>
  );
};
