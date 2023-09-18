import { notifyError } from '@autonolas/frontend-library';

import { ADDRESS_ZERO } from 'common-util/functions';

export const getProductValueFromEvent = (product, events, keyName) => {
  if ((events || []).length === 0) {
    return product[keyName];
  }

  if (product.token !== ADDRESS_ZERO) {
    return product[keyName];
  }

  const event = events.find(
    (e) => e.returnValues.productId === `${product.id}`,
  );
  if (!event) notifyError('Product not found in the event list');
  return event.returnValues[keyName];
};
