import { ADDRESS_ZERO, notifyError } from 'common-util/functions';

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

/**
 * Updates the priceLP for products that are not LP tokens
 * @example
 * if Address = 0x0000000...
 *  priceLP = fetch from event
 * else
 *  priceLP = from the product (as it is)
 */
export const updatePriceLpForProducts = (productList, events) => productList.map((product) => {
  if (product.token !== ADDRESS_ZERO) return product;

  const event = events.find(
    (e) => e.returnValues.productId === `${product.id}`,
  );
  const priceLpFromEvent = event?.returnValues?.priceLP || 0;
  return { ...product, priceLP: priceLpFromEvent };
});
