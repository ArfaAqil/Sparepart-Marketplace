describe('Admin Module', () => {
  const moderateProduct = (product, action) => {
    if (action === 'approve') return { ...product, status: 'approved' };
    if (action === 'reject') return { ...product, status: 'rejected' };
    return product;
  };

  const blockUser = (user) => {
    return { ...user, status: 'blocked' };
  };

  test('should approve product', () => {
    const product = { id: 1, name: 'Test Product', status: 'pending' };
    const result = moderateProduct(product, 'approve');
    expect(result.status).toBe('approved');
  });

  test('should reject product', () => {
    const product = { id: 1, name: 'Test Product', status: 'pending' };
    const result = moderateProduct(product, 'reject');
    expect(result.status).toBe('rejected');
  });

  test('should block user', () => {
    const user = { id: 1, username: 'buyer1', status: 'active' };
    const result = blockUser(user);
    expect(result.status).toBe('blocked');
  });
});