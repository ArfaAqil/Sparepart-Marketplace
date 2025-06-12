describe('Seller Module', () => {
  const updateOrderStatus = (order, newStatus, trackingNumber) => {
    if (newStatus === 'shipped' && !trackingNumber) return null;
    return { ...order, status: newStatus, trackingNumber };
  };

  test('should update order status to shipped with tracking number', () => {
    const order = { orderNumber: 'ORD001', status: 'pending', trackingNumber: null };
    const updatedOrder = updateOrderStatus(order, 'shipped', 'TRACK12345');
    expect(updatedOrder).toBeDefined();
    expect(updatedOrder.status).toBe('shipped');
    expect(updatedOrder.trackingNumber).toBe('TRACK12345');
  });

  test('should fail to update to shipped without tracking number', () => {
    const order = { orderNumber: 'ORD001', status: 'pending', trackingNumber: null };
    const updatedOrder = updateOrderStatus(order, 'shipped', '');
    expect(updatedOrder).toBeNull();
  });

  test('should update order status to delivered', () => {
    const order = { orderNumber: 'ORD001', status: 'shipped', trackingNumber: 'TRACK12345' };
    const updatedOrder = updateOrderStatus(order, 'delivered', 'TRACK12345');
    expect(updatedOrder.status).toBe('delivered');
  });
});