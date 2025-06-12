describe('Auth Module', () => {
  const mockUsers = [
    { email: 'buyer1@example.com', password: 'password123', role: 'buyer' },
    { email: 'seller1@example.com', password: 'seller123', role: 'seller' },
    { email: 'admin1@example.com', password: 'admin123', role: 'admin', secretKey: 'ADMKEY2025' },
  ];

  const validateUser = (email, password, role, secretKey) => {
    const user = mockUsers.find(u => u.email === email && u.password === password && u.role === role);
    if (user && role === 'admin' && secretKey !== user.secretKey) return null;
    return user;
  };

  test('should validate buyer credentials', () => {
    const user = validateUser('buyer1@example.com', 'password123', 'buyer');
    expect(user).toBeDefined();
    expect(user.role).toBe('buyer');
  });

  test('should validate seller credentials', () => {
    const user = validateUser('seller1@example.com', 'seller123', 'seller');
    expect(user).toBeDefined();
    expect(user.role).toBe('seller');
  });

  test('should validate admin credentials with correct secret key', () => {
    const user = validateUser('admin1@example.com', 'admin123', 'admin', 'ADMKEY2025');
    expect(user).toBeDefined();
    expect(user.role).toBe('admin');
  });

  test('should fail admin validation with incorrect secret key', () => {
    const user = validateUser('admin1@example.com', 'admin123', 'admin', 'WRONGKEY');
    expect(user).toBeNull();
  });

  test('should fail with incorrect credentials', () => {
    const user = validateUser('wrong@example.com', 'wrong', 'buyer');
    expect(user).toBeUndefined();
  });
});