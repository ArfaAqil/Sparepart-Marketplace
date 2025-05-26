document.addEventListener('DOMContentLoaded', async function() {
    // DOM Elements
    const roleBtns = document.querySelectorAll('.role-btn');
    const secretKeyGroup = document.getElementById('secretKeyGroup');
    const toggleAuthMode = document.getElementById('toggleAuthMode');
    const authForm = document.getElementById('authForm');
    const authTitle = document.querySelector('.auth-title');

    // Load users data from users.json and localStorage
    let users = [];
    async function loadUsers() {
        try {
            // Load from users.json
            const response = await fetch('../auth/data/users.json');
            if (!response.ok) throw new Error('Failed to load users.json');
            const jsonUsers = await response.json();
            
            // Load blocked status from localStorage
            const blockedUsers = JSON.parse(localStorage.getItem('blockedUsers') || '{}');
            
            // Load localStorage users
            const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
            
            // Combine users, ensuring no duplicates by email
            users = [...jsonUsers, ...localUsers].reduce((acc, user) => {
                if (!acc.some(u => u.email === user.email)) {
                    acc.push({
                        ...user,
                        blocked: blockedUsers[user.email] || false
                    });
                }
                return acc;
            }, []);
        } catch (error) {
            console.error('Error loading users:', error);
            // Fallback to localStorage only
            const blockedUsers = JSON.parse(localStorage.getItem('blockedUsers') || '{}');
            const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
            users = localUsers.map(user => ({
                ...user,
                blocked: blockedUsers[user.email] || false
            }));
        }
    }

    // Role Selection
    roleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            roleBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            secretKeyGroup.classList.toggle('hidden', this.dataset.role !== 'admin');
        });
    });

    // Toggle between Login/Register
    toggleAuthMode.addEventListener('click', function(e) {
        e.preventDefault();
        
        const isLogin = authTitle.textContent.includes('Вход');
        authTitle.textContent = isLogin ? 'Регистрация' : 'Вход в систему';
        toggleAuthMode.textContent = isLogin ? 'Войти в систему' : 'Зарегистрироваться';
        document.querySelector('.submit-btn').textContent = isLogin ? 'Зарегистрироваться' : 'Войти';

        // Add/remove username field
        if (isLogin) {
            const usernameField = `
                <div class="form-group" id="usernameGroup">
                    <label for="username">Имя пользователя</label>
                    <input type="text" id="username" placeholder="Придумайте логин" required>
                </div>
            `;
            authForm.insertAdjacentHTML('afterbegin', usernameField);
        } else {
            const usernameGroup = document.getElementById('usernameGroup');
            if (usernameGroup) usernameGroup.remove();
        }
    });

    // Form Submission
    authForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        await loadUsers(); // Ensure users are loaded
        
        const role = document.querySelector('.role-btn.active').dataset.role;
        const username = document.getElementById('username')?.value || '';
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const secretKey = document.getElementById('secretKey')?.value || '';
        const isLogin = authTitle.textContent.includes('Вход');

        if (isLogin) {
            // Login logic
            const user = users.find(u => u.email === email && u.password === password && u.role === role);
            if (!user) {
                alert('Неверный email, пароль или роль');
                return;
            }
            if (user.blocked) {
                alert('Ваш аккаунт заблокирован. Обратитесь к администратору.');
                return;
            }
            if (role === 'admin' && user.secretKey !== secretKey) {
                alert('Неверный секретный ключ');
                return;
            }

            // Save session
            localStorage.setItem('userData', JSON.stringify(user));
            redirectToDashboard(role);
        } else {
            // Registration logic
            if (users.some(u => u.email === email)) {
                alert('Этот email уже зарегистрирован');
                return;
            }
            if (role === 'admin' && secretKey !== 'ADMKEY2025') {
                alert('Неверный секретный ключ для администратора');
                return;
            }

            const newUser = {
                id: users.length + 1,
                username,
                email,
                password,
                role,
                blocked: false,
                ...(role === 'admin' && { secretKey })
            };

            // Save new user to localStorage
            let localUsers = JSON.parse(localStorage.getItem('users') || '[]');
            localUsers.push(newUser);
            localStorage.setItem('users', JSON.stringify(localUsers));
            localStorage.setItem('userData', JSON.stringify(newUser));
            alert('Регистрация успешна!');
            redirectToDashboard(role);
        }
    });

    function redirectToDashboard(role) {
        switch (role) {
            case 'buyer':
                window.location.href = '../dashboard/buyer/index.html';
                break;
            case 'seller':
                window.location.href = '../dashboard/seller/index.html';
                break;
            case 'admin':
                window.location.href = '../dashboard/admin/index.html';
                break;
            default:
                alert('Недопустимая роль');
        }
    }
});