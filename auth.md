# Документация: Модуль аутентификации (`auth`)

## Обзор

Модуль `auth` отвечает за аутентификацию и регистрацию пользователей в маркетплейсе автозапчастей. Он поддерживает три роли: покупатель, продавец и администратор. Модуль обеспечивает безопасный вход, регистрацию и управление сессиями через `localStorage`.

## Структура

```
auth/
├── data/
│   └── users.json      # Хранилище данных пользователей
├── index.html          # Страница входа и регистрации
├── style.css           # Стили для интерфейса
└── script.js           # Логика аутентификации
```

### `data/users.json`

- **Описание**: JSON-файл, содержащий начальные данные пользователей.
- **Формат**:

  ```json
  [
    {
      "id": 1,
      "username": "Покупатель1",
      "email": "buyer1@example.com",
      "password": "password123",
      "role": "buyer"
    },
    {
      "id": 2,
      "username": "Продавец1",
      "email": "seller1@example.com",
      "password": "password123",
      "role": "seller"
    },
    {
      "id": 3,
      "username": "Админ1",
      "email": "admin1@example.com",
      "password": "password123",
      "role": "admin",
      "secretKey": "ADMKEY2025"
    }
  ]
  ```
- **Примечание**: Данные из `users.json` объединяются с данными в `localStorage`, избегая дублирования по `email`.

### `index.html`

- **Описание**: HTML-страница для входа и регистрации.
- **Ключевые элементы**:
  - **Переключатель ролей**: Кнопки для выбора роли (`buyer`, `seller`, `admin`).
  - **Форма аутентификации**: Поля для email/телефона, пароля и секретного ключа (для админа).
  - **Переключатель режимов**: Ссылка для переключения между входом и регистрацией.
- **Зависимости**: Подключает `style.css` и `script.js`.

### `style.css`

- **Описание**: CSS-файл, определяющий стили для страницы аутентификации.
- **Основные классы**:
  - `.auth-header`: Шапка страницы.
  - `.auth-card`: Контейнер формы.
  - `.role-btn`: Стили для кнопок выбора роли.
  - `.form-group`: Стили для полей ввода.
  - `.submit-btn`: Стили для кнопки отправки формы.

### `script.js`

- **Описание**: JavaScript-файл, реализующий логику аутентификации и регистрации.

- **Основные функции**:

  1. **Загрузка данных пользователей**:
     - Загружает данные из `users.json` и `localStorage`.
     - Объединяет данные, исключая дубли по `email`.
  2. **Переключение ролей**:
     - Управляет активной ролью через класс `.active` на кнопках `.role-btn`.
     - Показывает/скрывает поле секретного ключа для роли `admin`.
  3. **Переключение режимов (вход/регистрация)**:
     - Динамически изменяет заголовок, текст кнопки и добавляет/удаляет поле имени пользователя.
  4. **Обработка формы**:
     - **Вход**:
       - Проверяет соответствие `email`, `password` и `role`.
       - Для админа дополнительно проверяет `secretKey`.
       - Сохраняет данные пользователя в `localStorage` (`userData`).
     - **Регистрация**:
       - Проверяет уникальность `email`.
       - Для админа проверяет `secretKey` (`ADMKEY2025`).
       - Создаёт нового пользователя и сохраняет в `localStorage`.
  5. **Перенаправление**:
     - После успешного входа/регистрации перенаправляет на соответствующую панель:
       - Покупатель: `dashboard/buyer/index.html`
       - Продавец: `dashboard/seller/index.html`
       - Админ: `dashboard/admin/index.html`

- **Код**:

  ```javascript
  document.addEventListener('DOMContentLoaded', async function() {
      // Загрузка пользователей
      let users = [];
      try {
          const response = await fetch('../auth/data/users.json');
          const jsonUsers = await response.json();
          const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
          users = Array.from(new Map([...jsonUsers, ...localUsers].map(u => [u.email, u])).values());
      } catch (error) {
          console.error('Error loading users:', error);
          users = JSON.parse(localStorage.getItem('users') || '[]');
      }
  
      // Переключение ролей
      roleBtns.forEach(btn => {
          btn.addEventListener('click', function() {
              roleBtns.forEach(b => b.classList.remove('active'));
              this.classList.add('active');
              secretKeyGroup.classList.toggle('hidden', this.dataset.role !== 'admin');
          });
      });
  
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
              const newUser = { id: users.length + 1, email, password, role, ... };
              users.push(newUser);
              localStorage.setItem('users', JSON.stringify(users));
              redirectToDashboard(role);
          }
      });
  });
  ```

## Зависимости

- **Font Awesome**: Не используется в `auth`, но подключена в проекте для единообразия.
- **Локальный сервер**: Для корректной работы `fetch` требуется запуск через `http-server`.

## Инструкции по использованию

1. Перейдите на `auth/index.html`.
2. Выберите роль (покупатель, продавец, админ).
3. Введите email/телефон и пароль или зарегистрируйтесь, нажав «Зарегистрироваться».
4. Для роли администратора введите секретный ключ (`ADMKEY2025` при регистрации).

## Тестирование

- **Сценарии**:
  - Успешный вход с существующими данными.
  - Регистрация нового пользователя.
  - Ошибка при неверном пароле/секретном ключе.
  - Проверка перенаправления на правильную панель.
- **Инструменты**: Ручное тестирование, DevTools для отладки.

## Ограничения

- Пароли хранятся в открытом виде (небезопасно для продакшена).
- Нет восстановления пароля.
- Отсутствует серверная валидация.

## Будущие улучшения

- Хеширование паролей (например, с использованием bcrypt).
- Интеграция с сервером для хранения пользователей.
