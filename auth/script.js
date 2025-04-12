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
                <div class="form-group">
                    <label for="username">Имя пользователя</label>
                    <input type="text" id="username" placeholder="Придумайте логин" required>
                </div>
            `;
            authForm.insertAdjacentHTML('afterbegin', usernameField);
        } else {
            const usernameField = document.getElementById('username');
            if (usernameField) usernameField.remove();
        }
    });

    // Form Submission
    authForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const role = document.querySelector('.role-btn.active').dataset.role;
        const username = document.getElementById('username')?.value || '';
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Only allow buyer role for now
        if (role !== 'buyer') {
            alert('Функции для продавцов и администраторов пока недоступны');
            return;
        }
        
        // Save user data to localStorage
        const userData = {
            username,
            email,
            password,
            role
        };
        localStorage.setItem('userData', JSON.stringify(userData));
        
        // Redirect to buyer dashboard
        window.location.href = '../dashboard/buyer/index.html';
    });
});