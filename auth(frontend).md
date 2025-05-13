# Документация: Модуль авторизации (`auth`)

## Обзор

Модуль `auth` отвечает за авторизацию и регистрацию пользователей на платформе электронной коммерции автозапчастей. Он предоставляет интерфейс для входа и регистрации пользователей с тремя ролями: **покупатель**, **продавец** и **администратор**. Модуль использует `localStorage` для хранения пользовательских данных и файл `users.json` для начальной загрузки пользователей. Интерфейс реализован на русском языке, адаптивен и использует минималистичный дизайн с акцентом на удобство использования.

```javascript
// Пример структуры данных пользователя в localStorage
const userData = {
    id: 1,
    username: "buyer1",
    email: "buyer1@example.com",
    role: "buyer"
};
localStorage.setItem('userData', JSON.stringify(userData));
```

## Структура директории

```
auth/
├── data/
│   └── users.json    # Данные пользователей
├── index.html        # Страница авторизации/регистрации
├── style.css         # Стили для страницы
└── script.js         # Логика авторизации и регистрации
```

## Основные компоненты

### 1. `index.html` (Страница авторизации/регистрации)

**Описание**: Главная страница модуля, предоставляющая форму для входа или регистрации пользователей с выбором роли.

**Функции**:
- Выбор роли пользователя: покупатель, продавец или администратор.
- Форма для ввода email/телефона, пароля и (для администратора) секретного ключа.
- Переключение между режимами входа и регистрации.
- Валидация введённых данных (на стороне клиента).
- Перенаправление на соответствующий дашборд после успешной авторизации/регистрации.

**Основные элементы**:
- `.role-selector`: Кнопки выбора роли (`buyer`, `seller`, `admin`).
- `#authForm`: Форма авторизации/регистрации.
- `#secretKeyGroup`: Поле секретного ключа, отображаемое только для администратора.
- `#toggleAuthMode`: Ссылка для переключения между входом и регистрацией.
- `.submit-btn`: Кнопка отправки формы.

**Код**:
```html
<div class="auth-card">
    <h1 class="auth-title">Вход в систему</h1>
    <div class="role-selector">
        <button class="role-btn active" data-role="buyer">Покупатель</button>
        <button class="role-btn" data-role="seller">Продавец</button>
        <button class="role-btn" data-role="admin">Админ</button>
    </div>
    <form id="authForm" class="auth-form">
        <div class="form-group">
            <label for="email">Email или телефон</label>
            <input type="text" id="email" placeholder="example@mail.ru">
        </div>
        <div class="form-group">
            <label for="password">Пароль</label>
            <input type="password" id="password" placeholder="••••••••">
        </div>
        <div class="form-group hidden" id="secretKeyGroup">
            <label for="secretKey">Секретный ключ</label>
            <input type="password" id="secretKey">
        </div>
        <button type="submit" class="submit-btn">Продолжить</button>
    </form>
    <div class="auth-footer">
        <span id="toggleAuthMode">Зарегистрироваться</span>
    </div>
</div>
```

**Примечание**: 
- Поле имени пользователя (`username`) добавляется динамически при регистрации.
- Поле секретного ключа отображается только для роли администратора.

### 2. `script.js` (Логика авторизации/регистрации)

**Описание**: Управляет логикой обработки формы, валидацией данных, загрузкой пользователей и перенаправлением.

**Функции**:
- **Загрузка пользователей**: Из `users.json` и `localStorage` с дедупликацией по email.
- **Выбор роли**: Переключение активной роли и отображение/скрытие поля секретного ключа.
- **Переключение режимов**: Динамическое изменение формы для входа или регистрации (добавление/удаление поля имени пользователя).
- **Валидация**:
  - Для входа: проверка email, пароля и (для администратора) секретного ключа.
  - Для регистрации: проверка уникальности email и (для администратора) корректности секретного ключа (`ADMKEY2025`).
- **Сохранение данных**: Сохранение нового пользователя в `localStorage` и текущей сессии в `userData`.
- **Перенаправление**: На соответствующий дашборд в зависимости от роли (`buyer`, `seller`, `admin`).

**Код**:
```javascript
// Загрузка пользователей
async function loadUsers() {
    let users = [];
    try {
        const response = await fetch('../auth/data/users.json');
        if (!response.ok) throw new Error('Failed to load users.json');
        const jsonUsers = await response.json();
        const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
        users = Array.from(new Map([...jsonUsers, ...localUsers].map(u => [u.email, u])).values());
    } catch (error) {
        console.error('Error loading users:', error);
        users = JSON.parse(localStorage.getItem('users') || '[]');
    }
    return users;
}

// Обработка формы
authForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const role = document.querySelector('.role-btn.active').dataset.role;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const isLogin = authTitle.textContent.includes('Вход');
    
    if (isLogin) {
        const user = users.find(u => u.email === email && u.password === password && u.role === role);
        if (!user) {
            alert('Неверный email, пароль или роль');
            return;
        }
        localStorage.setItem('userData', JSON.stringify(user));
        redirectToDashboard(role);
    } else {
        if (users.some(u => u.email === email)) {
            alert('Этот email уже зарегистрирован');
            return;
        }
        const newUser = { id: users.length + 1, username: document.getElementById('username').value, email, password, role };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('userData', JSON.stringify(newUser));
        redirectToDashboard(role);
    }
});
```

**Примечание**:
- Секретный ключ для администратора жёстко закодирован как `ADMKEY2025` для демонстрационных целей.
- При ошибке загрузки `users.json` используется только `localStorage`.

### 3. `data/users.json` (Данные пользователей)

**Описание**: Файл с начальными данными пользователей для тестирования.

**Формат**:
```json
[
    {
        "id": 1,
        "username": "buyer1",
        "email": "buyer1@example.com",
        "password": "password123",
        "role": "buyer"
    },
    {
        "id": 2,
        "username": "admin1",
        "email": "admin1@example.com",
        "password": "admin123",
        "role": "admin",
        "secretKey": "ADMKEY2025"
    },
    {
        "id": 3,
        "username": "seller1",
        "email": "seller1@example.com",
        "password": "seller123",
        "role": "seller"
    }
]
```

**Примечание**:
- Поле `secretKey` присутствует только для роли администратора.
- Пароли хранятся в открытом виде (для демо); в продакшене требуется хеширование.

## Зависимости

- **CSS**: Стили определены в `style.css`, без внешних библиотек.
- **Данные**:
  - `auth/data/users.json`: Начальные данные пользователей.
  - `localStorage`: Хранение зарегистрированных пользователей и текущей сессии.

**Код**:
```html
<link rel="stylesheet" href="style.css">
```

## Инструкции по использованию

1. **Переход на страницу**:
   - Откройте `auth/index.html` в браузере.
2. **Выбор роли**:
   - Выберите роль: «Покупатель», «Продавец» или «Админ».
   - Для роли «Админ» появится поле секретного ключа.
3. **Вход**:
   - Введите email/телефон и пароль.
   - Для администратора введите секретный ключ (`ADMKEY2025`).
   - Нажмите «Продолжить» для входа.
   - После успешного входа вы будете перенаправлены на соответствующий дашборд:
     - Покупатель: `dashboard/buyer/index.html`
     - Продавец: `dashboard/seller/index.html`
     - Админ: `dashboard/admin/index.html`
4. **Регистрация**:
   - Нажмите «Зарегистрироваться» для переключения режима.
   - Введите имя пользователя, email/телефон и пароль.
   - Для администратора введите секретный ключ.
   - Нажмите «Зарегистрироваться» для создания аккаунта.
   - После регистрации вы автоматически войдёте в систему и будете перенаправлены.
5. **Выход**:
   - В дашборде нажмите «Выйти» для удаления `userData` и возвращения на страницу авторизации.

**Код**:
```javascript
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
    }
}
```

## Тестирование

### Сценарии тестирования
1. **Вход**:
   - Попробуйте войти с данными из `users.json` (например, `buyer1@example.com`, пароль `password123`, роль «Покупатель»).
   - Проверьте вход с неверным паролем или email.
   - Для роли администратора проверьте вход с неверным секретным ключом.
2. **Регистрация**:
   - Зарегистрируйте нового пользователя с уникальным email.
   - Попробуйте зарегистрироваться с уже существующим email.
   - Проверьте регистрацию администратора с неверным секретным ключом.
3. **Переключение режимов**:
   - Убедитесь, что переключение между входом и регистрацией корректно обновляет форму.
   - Проверьте добавление/удаление поля имени пользователя.
4. **Роли**:
   - Проверьте, что выбор роли изменяет видимость поля секретного ключа.
   - Убедитесь, что перенаправление соответствует выбранной роли.
5. **Обработка ошибок**:
   - Отключите доступ к `users.json` и проверьте работу с `localStorage`.
   - Проверьте сообщения об ошибках при неверных данных.