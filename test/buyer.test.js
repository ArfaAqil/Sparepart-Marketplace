describe('Buyer Module', () => {
  const calculateCartTotal = (items) => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const validateCheckout = (formData) => {
    const { fullName, address, phone, payment } = formData;
    if (!fullName || !address || !phone || !payment) return false;
    if (!phone.match(/^\+?\d{10,12}$/)) return false;
    return true;
  };

  test('should calculate correct cart total', () => {
    const cartItems = [
      { productId: 1, price: 12500, quantity: 2 },
      { productId: 2, price: 3500, quantity: 1 },
    ];
    const total = calculateCartTotal(cartItems);
    expect(total).toBe(28500); // (12500 * 2) + (3500 * 1)
  });

  test('should return 0 for empty cart', () => {
    const total = calculateCartTotal([]);
    expect(total).toBe(0);
  });

  test('should validate checkout form with valid data', () => {
    const formData = {
      fullName: 'Иван Иванов',
      address: 'Москва, ул. Ленина, 1',
      phone: '+79991234567',
      payment: 'card',
    };
    expect(validateCheckout(formData)).toBe(true);
  });

  test('should fail checkout with invalid phone', () => {
    const formData = {
      fullName: 'Иван Иванов',
      address: 'Москва, ул. Ленина, 1',
      phone: '123',
      payment: 'card',
    };
    expect(validateCheckout(formData)).toBe(false);
  });
});