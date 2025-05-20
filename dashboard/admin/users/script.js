document.addEventListener('DOMContentLoaded', async function() {
    const userList = document.getElementById('userList');
    const roleFilter = document.getElementById('roleFilter');
    const dateFilter = document.getElementById('dateFilter');
    const searchFilter = document.getElementById('searchFilter');
    const userData = JSON.parse(localStorage.getItem('userData') || {});

    if (userData.username) {
        document.getElementById('displayUsername').textContent = userData.username;
    }

    let users = [];
    async function loadUsers() {
        try {
            const response = await fetch('../../../auth/data/users.json');
            if (!response.ok) throw new Error('Failed to load users.json');
            let jsonUsers = await response.json();
            jsonUsers = jsonUsers.map(u => ({ ...u, blocked: u.blocked || false }));

            let localUsers = JSON.parse(localStorage.getItem('users') || '[]');
            localUsers = localUsers.map(u => ({ ...u, blocked: u.blocked || false }));

            const allUsers = [...jsonUsers, ...localUsers];
            users = Array.from(new Map(allUsers.map(u => [u.email, u])).values());
            renderUsers(users);
        } catch (e) {
            console.error('Error loading users:', e);
            users = JSON.parse(localStorage.getItem('users') || '[]');
            renderUsers(users);
        }
    }

    function renderUsers(usersToRender) {
        const role = roleFilter.value;
        const date = dateFilter.value;
        const search = searchFilter.value.toLowerCase();

        const filteredUsers = usersToRender.filter(user => {
            const matchesRole = role === 'all' || user.role === role;
            const matchesDate = !date || new Date(user.registrationDate || user.date).toISOString().split('T')[0] === date;
            const matchesSearch = !search || 
                user.username.toLowerCase().includes(search) || 
                user.email.toLowerCase().includes(search);
            return matchesRole && matchesDate && matchesSearch;
        });

        if (filteredUsers.length === 0) {
            userList.innerHTML = '<p>Нет пользователей по выбранным критериям</p>';
            return;
        }

        userList.innerHTML = filteredUsers.map(user => `
            <div class="user-card ${user.blocked ? 'blocked' : ''}">
                <div class="user-info">
                    <h3>${user.username}</h3>
                    <p>Email: ${user.email}</p>
                    <p>Роль: ${user.role}</p>
                    <p>Статус: ${user.blocked ? 'Заблокирован' : 'Активен'}</p>
                    <p>Дата регистрации: ${formatDate(user.registrationDate || user.date)}</p>
                </div>
                <div class="user-actions">
                    <button class="btn ${user.blocked ? 'unblock-btn' : 'block-btn'}" data-email="${user.email}">
                        ${user.blocked ? 'Разблокировать' : 'Заблокировать'}
                    </button>
                    <button class="btn reset-password-btn" data-email="${user.email}">Сбросить пароль</button>
                    <button class="btn change-role-btn" data-email="${user.email}">Изменить роль</button>
                    <button class="btn delete-btn" data-email="${user.email}">Удалить</button>
                </div>
            </div>
        `).join('');
    }

    function formatDate(dateString) {
        if (!dateString) return 'Не указана';
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('ru-RU', options);
    }

    userList.addEventListener('click', function(e) {
        const email = e.target.dataset.email;
        if (!email) return;

        if (e.target.classList.contains('block-btn') || e.target.classList.contains('unblock-btn')) {
            const action = e.target.classList.contains('block-btn') ? 'Заблокировать' : 'Разблокировать';
            if (confirm(`${action} пользователя ${email}?`)) {
                let localUsers = JSON.parse(localStorage.getItem('users') || '[]');
                localUsers = localUsers.map(u => u.email === email ? { ...u, blocked: !u.blocked } : u);
                localStorage.setItem('users', JSON.stringify(localUsers));
                loadUsers();
            }
        } else if (e.target.classList.contains('reset-password-btn')) {
            if (confirm(`Сбросить пароль для ${email}?`)) {
                const tempPassword = 'temp' + Math.random().toString(36).slice(2, 10);
                let localUsers = JSON.parse(localStorage.getItem('users') || '[]');
                localUsers = localUsers.map(u => u.email === email ? { ...u, password: tempPassword } : u);
                localStorage.setItem('users', JSON.stringify(localUsers));
                alert(`Временный пароль для ${email}: ${tempPassword}`);
                loadUsers();
            }
        } else if (e.target.classList.contains('change-role-btn')) {
            const newRole = prompt('Введите новую роль (buyer, seller, admin):', 'buyer');
            if (newRole && ['buyer', 'seller', 'admin'].includes(newRole)) {
                let localUsers = JSON.parse(localStorage.getItem('users') || '[]');
                localUsers = localUsers.map(u => u.email === email ? { ...u, role: newRole } : u);
                localStorage.setItem('users', JSON.stringify(localUsers));
                loadUsers();
            } else {
                alert('Недопустимая роль');
            }
        } else if (e.target.classList.contains('delete-btn')) {
            if (confirm(`Удалить пользователя ${email}?`)) {
                let localUsers = JSON.parse(localStorage.getItem('users') || '[]');
                localUsers = localUsers.filter(u => u.email !== email);
                localStorage.setItem('users', JSON.stringify(localUsers));
                loadUsers();
            }
        }
    });

    roleFilter.addEventListener('change', () => renderUsers(users));
    dateFilter.addEventListener('change', () => renderUsers(users));
    searchFilter.addEventListener('input', () => renderUsers(users));

    document.querySelector('.logout-btn').addEventListener('click', function() {
        localStorage.removeItem('userData');
        window.location.href = '../../../auth/index.html';
    });

    loadUsers();
});