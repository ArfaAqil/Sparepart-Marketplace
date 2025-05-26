document.addEventListener('DOMContentLoaded', async function() {
    const userList = document.getElementById('userList');
    const roleFilter = document.getElementById('roleFilter');
    const searchFilter = document.getElementById('searchFilter');
    const userData = JSON.parse(localStorage.getItem('userData') || {});

    if (userData.username) {
        document.getElementById('displayUsername').textContent = userData.username;
    }

    let users = [];
    async function loadUsers() {
        try {
            // Load users from users.json
            const response = await fetch('../../../auth/data/users.json');
            if (!response.ok) throw new Error('Failed to load users.json');
            let jsonUsers = await response.json();

            // Load blocked status from localStorage
            let blockedUsers = JSON.parse(localStorage.getItem('blockedUsers') || '{}');

            // Merge users with blocked status
            users = jsonUsers.map(user => ({
                ...user,
                blocked: blockedUsers[user.email] || false
            }));

            // Include localStorage users (e.g., registered users) and merge blocked status
            let localUsers = JSON.parse(localStorage.getItem('users') || '[]');
            localUsers.forEach(localUser => {
                if (!users.some(u => u.email === localUser.email)) {
                    users.push({
                        ...localUser,
                        blocked: blockedUsers[localUser.email] || false
                    });
                }
            });

            renderUsers(users);
        } catch (e) {
            console.error('Error loading users:', e);
            // Fallback to localStorage users
            let localUsers = JSON.parse(localStorage.getItem('users') || '[]');
            let blockedUsers = JSON.parse(localStorage.getItem('blockedUsers') || '{}');
            users = localUsers.map(user => ({
                ...user,
                blocked: blockedUsers[user.email] || false
            }));
            renderUsers(users);
        }
    }

    function renderUsers(usersToRender) {
        const role = roleFilter.value;
        const search = searchFilter.value.toLowerCase();

        const filteredUsers = usersToRender.filter(user => {
            const matchesRole = role === 'all' || user.role === role;
            const matchesSearch = !search || 
                user.username.toLowerCase().includes(search) || 
                user.email.toLowerCase().includes(search);
            return matchesRole && matchesSearch;
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

    userList.addEventListener('click', function(e) {
        const email = e.target.dataset.email;
        if (!email) return;

        if (e.target.classList.contains('block-btn') || e.target.classList.contains('unblock-btn')) {
            const action = e.target.classList.contains('block-btn') ? 'Заблокировать' : 'Разблокировать';
            if (confirm(`${action} пользователя ${email}?`)) {
                let blockedUsers = JSON.parse(localStorage.getItem('blockedUsers') || '{}');
                blockedUsers[email] = !blockedUsers[email]; // Toggle blocked status
                localStorage.setItem('blockedUsers', JSON.stringify(blockedUsers));
                loadUsers();
            }
        } else if (e.target.classList.contains('reset-password-btn')) {
            if (confirm(`Сбросить пароль для ${email}?`)) {
                const tempPassword = 'temp' + Math.random().toString(36).slice(2, 10);
                let localUsers = JSON.parse(localStorage.getItem('users') || '[]');
                const userIndex = localUsers.findIndex(u => u.email === email);
                if (userIndex !== -1) {
                    localUsers[userIndex].password = tempPassword;
                    localStorage.setItem('users', JSON.stringify(localUsers));
                }
                alert(`Временный пароль для ${email}: ${tempPassword}`);
                loadUsers();
            }
        } else if (e.target.classList.contains('change-role-btn')) {
            const newRole = prompt('Введите новую роль (buyer, seller, admin):', 'buyer');
            if (newRole && ['buyer', 'seller', 'admin'].includes(newRole)) {
                let localUsers = JSON.parse(localStorage.getItem('users') || '[]');
                const userIndex = localUsers.findIndex(u => u.email === email);
                if (userIndex !== -1) {
                    localUsers[userIndex].role = newRole;
                    localStorage.setItem('users', JSON.stringify(localUsers));
                }
                loadUsers();
            } else {
                alert('Недопустимая роль');
            }
        } else if (e.target.classList.contains('delete-btn')) {
            if (confirm(`Удалить пользователя ${email}?`)) {
                let localUsers = JSON.parse(localStorage.getItem('users') || '[]');
                localUsers = localUsers.filter(u => u.email !== email);
                localStorage.setItem('users', JSON.stringify(localUsers));
                let blockedUsers = JSON.parse(localStorage.getItem('blockedUsers') || '{}');
                delete blockedUsers[email];
                localStorage.setItem('blockedUsers', JSON.stringify(blockedUsers));
                loadUsers();
            }
        }
    });

    roleFilter.addEventListener('change', () => renderUsers(users));
    searchFilter.addEventListener('input', () => renderUsers(users));

    document.querySelector('.logout-btn').addEventListener('click', function() {
        localStorage.removeItem('userData');
        window.location.href = '../../../auth/index.html';
    });

    loadUsers();
});