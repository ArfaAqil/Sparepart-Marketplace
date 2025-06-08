document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const roleBtns = document.querySelectorAll('.role-btn');
    const secretKeyGroup = document.getElementById('secretKeyGroup');
    const toggleAuthMode = document.getElementById('toggleAuthMode');
    const authForm = document.getElementById('authForm');
    const authTitle = document.querySelector('.auth-title');

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

        const role = document.querySelector('.role-btn.active').dataset.role;
        const username = document.getElementById('username')?.value || '';
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const secretKey = document.getElementById('secretKey')?.value || '';
        const isLogin = authTitle.textContent.includes('Вход');

        if (isLogin) {
            // Отправка на сервер для входа
            const response = await fetch('http://localhost:8000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role, secretKey })
            });
            const result = await response.json();
            if (!result.success) {
                alert(result.message || 'Ошибка входа');
                return;
            }
            localStorage.setItem('userData', JSON.stringify(result.user));
            redirectToDashboard(role);
        } else {
            // Отправка на сервер для регистрации
            const response = await fetch('http://localhost:8000/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password, role, secretKey })
            });
            const result = await response.json();
            if (!result.success) {
                alert(result.message || 'Ошибка регистрации');
                return;
            }
            localStorage.setItem('userData', JSON.stringify(result.user));
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