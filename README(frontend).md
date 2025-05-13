# Маркетплейс автозапчастей - Документация фронтенда

## Описание проекта
Маркетплейс автозапчастей предоставляет платформу для покупки и продажи автозапчастей. Пользователи делятся на три роли: покупатели, продавцы и администраторы. Проект включает модули авторизации, дашборд покупателя и продавца, обеспечивая удобное взаимодействие с каталогом товаров, заказами и доставкой.

## Структура проекта

```
marketplace-autoparts/
├── auth/                  # Модуль авторизации
│   ├── data/
│   │   └── users.json     # Данные пользователей
│   ├── index.html         # Страница входа/регистрации
│   ├── style.css          # Стили
│   └── script.js          # Логика авторизации
├── dashboard/
│   ├── buyer/             # Модуль покупателя
│   │   ├── cart/          # Корзина
│   │   │   ├── index.html
│   │   │   ├── style.css
│   │   │   └── script.js
│   │   ├── checkout/      # Оформление заказа
│   │   │   ├── index.html
│   │   │   ├── style.css
│   │   │   └── script.js
│   │   ├── data/          # Данные товаров и заказов
│   │   │   ├── products.json
│   │   │   └── orders.json
│   │   ├── order/         # История заказов
│   │   │   ├── index.html
│   │   │   ├── style.css
│   │   │   └── script.js
│   │   ├── shipping/      # Отслеживание доставки
│   │   │   ├── index.html
│   │   │   ├── style.css
│   │   │   └── script.js
│   │   ├── index.html     # Главная страница
│   │   ├── style.css      # Стили
│   │   └── script.js      # Логика
│   └── seller/            # Модуль продавца
│       ├── order/         # Управление заказами
│       │   ├── index.html
│       │   ├── style.css
│       │   └── script.js
│       ├── process-order/ # Обработка заказов
│       │   ├── index.html
│       │   ├── style.css
│       │   └── script.js
│       ├── shipping/      # Управление доставкой
│       │   ├── index.html
│       │   ├── style.css
│       │   └── script.js
│       ├── index.html     # Главная страница
│       ├── style.css      # Стили
│       └── script.js      # Логика
└── Images/                # Изображения товаров
```

## Модуль авторизации (`auth`)

### Основные функции
- Регистрация новых пользователей (покупатель, продавец, администратор).
- Вход в систему с валидацией данных.
- Переключение между режимами входа и регистрации.
- Проверка секретного ключа для администраторов.
- Перенаправление на соответствующий дашборд после успешной авторизации.
- Сохранение пользовательских данных в localStorage для персистентности.

### Ключевые компоненты

**index.html**:
```html
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Авторизация</title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
    <div class="auth-card">
        <h1 class="auth-title">Вход в систему</h1>
        <div class="role-selector">
            <button class="role-btn active" data-role="buyer">Покупатель</button>
            <button class="role-btn" data-role="seller">Продавец</button>
            <button class="role-btn" data-role="admin">Админ</button>
        </div>
        <form id="authForm" class="auth-form">
            <input type="email" id="email" placeholder="Email" required>
            <input type="password" id="password" placeholder="Пароль" required>
            <input type="text" id="secretKey" placeholder="Секретный ключ (для админа)" style="display: none;">
            <button type="submit">Войти</button>
            <a href="#" id="toggleAuth">Нет аккаунта? Зарегистрируйтесь</a>
        </form>
    </div>
    <script src="script.js"></script>
</body>
</html>
```

**style.css**:
```css
body {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: #f0f2f5;
    font-family: Arial, sans-serif;
}
.auth-card {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 400px;
}
.auth-title {
    text-align: center;
    margin-bottom: 1.5rem;
}
.role-selector {
    display: flex;
    gap: 10px;
    margin-bottom: 1.5rem;
}
.role-btn {
    flex: 1;
    padding: 10px;
    border: 1px solid #ccc;
    background: #fff;
    cursor: pointer;
}
.role-btn.active {
    background: #007bff;
    color: white;
    border-color: #007bff;
}
.auth-form {
    display: flex;
    flex-direction: column;
    gap: 15px;
}
.auth-form input {
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
}
.auth-form button {
    padding: 10px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}
.auth-form button:hover {
    background: #0056b3;
}
```

**script.js**:
```javascript
const authForm = document.getElementById('authForm');
const toggleAuth = document.getElementById('toggleAuth');
const secretKeyInput = document.getElementById('secretKey');
let isLogin = true;

// Переключение ролей
document.querySelectorAll('.role-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelector('.role-btn.active').classList.remove('active');
        btn.classList.add('active');
        secretKeyInput.style.display = btn.dataset.role === 'admin' ? 'block' : 'none';
    });
});

// Переключение между входом и регистрацией
toggleAuth.addEventListener('click', (e) => {
    e.preventDefault();
    isLogin = !isLogin;
    document.querySelector('.auth-title').textContent = isLogin ? 'Вход в систему' : 'Регистрация';
    authForm.querySelector('button').textContent = isLogin ? 'Войти' : 'Зарегистрироваться';
    toggleAuth.textContent = isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите';
});

// Загрузка пользователей
async function loadUsers() {
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
    return users;
}

// Сохранение пользователей
function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

// Обработка формы
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const role = document.querySelector('.role-btn.active').dataset.role;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const secretKey = secretKeyInput.value;
    let users = await loadUsers();

    if (isLogin) {
        const user = users.find(u => u.email === email && u.password === password && u.role === role);
        if (user) {
            if (role === 'admin' && secretKey !== user.secretKey) {
                alert('Неверный секретный ключ');
                return;
            }
            localStorage.setItem('currentUser', JSON.stringify(user));
            window.location.href = `../dashboard/${role}/index.html`;
        } else {
            alert('Неверные данные для входа');
        }
    } else {
        if (users.some(u => u.email === email)) {
            alert('Пользователь с таким email уже существует');
            return;
        }
        if (role === 'admin' && secretKey !== 'ADMKEY2025') {
            alert('Неверный секретный ключ для администратора');
            return;
        }
        const newUser = {
            id: users.length + 1,
            username: email.split('@')[0],
            email,
            password,
            role,
            secretKey: role === 'admin' ? secretKey : undefined
        };
        users.push(newUser);
        saveUsers(users);
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        window.location.href = `../dashboard/${role}/index.html`;
    }
});
```

## Модуль покупателя (`dashboard/buyer`)

### Основные функции
- Просмотр каталога товаров с фильтрами (цена, бренд, категория).
- Поиск товаров по названию и VIN-коду.
- Управление корзиной (добавление, удаление, изменение количества).
- Оформление заказа с выбором способа оплаты (карта, наложенный платеж).
- Просмотр истории заказов с детализацией.
- Отслеживание статуса доставки с номером отслеживания.

### Ключевые компоненты

**Главная страница (index.html)**:
```html
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Каталог товаров</title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
    <header>
        <h1>Маркетплейс автозапчастей</h1>
        <div class="search-bar">
            <input type="text" id="searchInput" placeholder="Поиск по названию или VIN...">
            <button id="searchBtn"><i class="fas fa-search"></i></button>
        </div>
        <a href="cart/index.html" class="cart-icon">
            <i class="fas fa-shopping-cart"></i>
            <span id="cartCount">0</span>
        </a>
    </header>
    <div class="filters">
        <select id="categoryFilter">
            <option value="">Все категории</option>
            <option value="brakes">Тормоза</option>
            <option value="engine">Двигатель</option>
        </select>
        <input type="number" id="priceMin" placeholder="Мин. цена">
        <input type="number" id="priceMax" placeholder="Макс. цена">
        <button id="applyFilters">Применить</button>
    </div>
    <div class="product-grid" id="productGrid"></div>
    <script src="script.js"></script>
</body>
</html>
```

**Корзина (cart/index.html)**:
```html
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Корзина</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>Корзина</h1>
    <div class="cart-container">
        <div class="cart-items" id="cartItems"></div>
        <div class="cart-summary">
            <h2>Итого</h2>
            <div class="summary-row">
                <span>Товары</span>
                <span id="subtotal">0 ₽</span>
            </div>
            <div class="summary-row">
                <span>Доставка</span>
                <span id="shipping">0 ₽</span>
            </div>
            <div class="summary-row total">
                <span>К оплате</span>
                <span id="total">0 ₽</span>
            </div>
            <a href="../checkout/index.html" class="checkout-btn">Оформить заказ</a>
        </div>
    </div>
    <script src="script.js"></script>
</body>
</html>
```

**Оформление заказа (checkout/index.html)**:
```html
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Оформление заказа</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>Оформление заказа</h1>
    <form id="checkoutForm">
        <h2>Данные доставки</h2>
        <input type="text" id="fullName" placeholder="ФИО" required>
        <input type="text" id="address" placeholder="Адрес доставки" required>
        <input type="tel" id="phone" placeholder="Телефон" required>
        <h2>Способ оплаты</h2>
        <select id="paymentMethod">
            <option value="card">Картой</option>
            <option value="cod">Наложенный платеж</option>
        </select>
        <button type="submit">Подтвердить заказ</button>
    </form>
    <div id="qrCode" style="display: none;">
        <h3>QR-код для оплаты</h3>
        <img id="qrImage">
    </div>
    <script src="script.js"></script>
</body>
</html>
```

## Модуль продавца (`dashboard/seller`)

### Основные функции
- Управление товарами (добавление, редактирование, удаление).
- Просмотр и обработка заказов.
- Изменение статусов заказов (в обработке, отправлено, доставлено).
- Управление доставкой (добавление номера отслеживания).
- Экспорт данных заказов в Excel.
- Аналитика продаж (графики, статистика).

### Ключевые компоненты

**Главная страница продавца (index.html)**:
```html
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Панель продавца</title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
    <header>
        <h1>Панель продавца</h1>
        <a href="../auth/index.html" class="logout-btn">Выйти</a>
    </header>
    <div class="seller-actions">
        <button id="addProductBtn">Добавить продукт</button>
        <a href="order/index.html">Просмотреть заказы</a>
        <a href="shipping/index.html">Управление доставкой</a>
    </div>
    <div class="product-grid" id="productGrid"></div>
    <script src="script.js"></script>
</body>
</html>
```

**Управление заказами (order/index.html)**:
```html
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Заказы</title>
    <link rel="stylesheet" href="style.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
</head>
<body>
    <h1>Заказы</h1>
    <div class="filters">
        <select id="statusFilter">
            <option value="">Все статусы</option>
            <option value="pending">В обработке</option>
            <option value="shipped">Отправлено</option>
            <option value="delivered">Доставлено</option>
        </select>
        <button id="exportExcel">Экспорт в Excel</button>
    </div>
    <div class="order-list" id="orderList"></div>
    <script src="script.js"></script>
</body>
</html>
```

**Обработка заказа (process-order/index.html)**:
```html
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Обработка заказа</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>Обработка заказа #<span id="orderNumber"></span></h1>
    <form id="processOrderForm">
        <label for="newStatus">Новый статус:</label>
        <select id="newStatus">
            <option value="pending">В обработке</option>
            <option value="shipped">Отправлено</option>
            <option value="delivered">Доставлено</option>
        </select>
        <input type="text" id="trackingNumber" placeholder="Номер отслеживания">
        <button type="submit">Обновить статус</button>
    </form>
    <script src="script.js"></script>
</body>
</html>
```

**script.js (process-order)**:
```javascript
const processOrderForm = document.getElementById('processOrderForm');
const newStatusSelect = document.getElementById('newStatus');
const trackingNumberInput = document.getElementById('trackingNumber');
const orderNumber = new URLSearchParams(window.location.search).get('order');

document.getElementById('orderNumber').textContent = order;

async function loadOrders() {
    try {
        const response = await fetch('../../buyer/data/orders.json');
        return await response.json();
    } catch (error) {
        console.error('Error loading orders:', error);
        return JSON.parse(localStorage.getItem('orders') || '[]');
    }
}

async function saveOrders(orders) {
    localStorage.setItem('orders', JSON.stringify(orders));
}

async function updateOrderStatus(orderNumber, newStatus, trackingNumber) {
    let orders = await loadOrders();
    const order = orders.find(o => o.orderNumber === orderNumber);
    if (order) {
        order.status = newStatus;
        if (trackingNumber) order.trackingNumber = trackingNumber;
        await saveOrders(orders);
        alert('Статус заказа обновлен');
        window.location.href = '../order/index.html';
    }
}

processOrderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newStatus = newStatusSelect.value;
    const trackingNumber = trackingNumberInput.value;
    if (newStatus === 'shipped' && !trackingNumber) {
        alert('Укажите номер отслеживания для статуса "Отправлено"');
        return;
    }
    await updateOrderStatus(order, newStatus, trackingNumber);
});
```

## Технологии и зависимости

- **Frontend**:
  - HTML5, CSS3, JavaScript (ES6+).
  - Асинхронные запросы (Fetch API).
  - Responsive дизайн с использованием Flexbox и Grid.

- **Хранение данных**:
  - `localStorage` для хранения пользовательских данных и заказов.
  - JSON-файлы (`users.json`, `products.json`, `orders.json`) для начальных данных.

- **Библиотеки**:
  ```html
  <!-- Font Awesome для иконок -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
  
  <!-- SheetJS для экспорта в Excel -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
  
  <!-- QR-код для наложенного платежа -->
  <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=COD-{orderNumber}">
  ```

## Инструкция по запуску

1. Установите `http-server` для локального сервера:
```bash
npm install -g http-server
```

2. Перейдите в корневую папку проекта:
```bash
cd marketplace-autoparts
```

3. Запустите сервер:
```bash
http-server -c-1
```

4. Откройте браузер и перейдите по адресу:
```
http://localhost:8080/auth/index.html
```

5. Для тестирования используйте тестовые учетные записи из `users.json`.

## Тестовые данные

**Пользователи (auth/data/users.json)**:
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

**Товары (dashboard/buyer/data/products.json)**:
```json
[
    {
        "id": 1,
        "name": "Тормозные колодки Toyota Corolla",
        "price": 12500,
        "images": ["../../Images/brake_pads.jpg"],
        "specifications": {
            "material": "Керамика",
            "compatibility": "Toyota Corolla 2015-2023",
            "brand": "Toyota",
            "category": "brakes"
        }
    },
    {
        "id": 2,
        "name": "Масляный фильтр Bosch",
        "price": 3500,
        "images": ["../../Images/oil_filter.jpg"],
        "specifications": {
            "material": "Синтетика",
            "compatibility": "Универсальный",
            "brand": "Bosch",
            "category": "engine"
        }
    }
]
```

**Заказы (dashboard/buyer/data/orders.json)**:
```json
[
    {
        "orderNumber": "ORD001",
        "userId": 1,
        "items": [
            {
                "productId": 1,
                "quantity": 2,
                "price": 12500
            }
        ],
        "total": 25000,
        "status": "pending",
        "trackingNumber": null,
        "date": "2025-05-10"
    }
]
```

## Дополнительные замечания
- **Безопасность**: Пароли хранятся в открытом виде для упрощения демонстрации. В продакшене рекомендуется использовать хеширование (например, bcrypt).
- **Локализация**: Интерфейс полностью на русском языке, но можно добавить поддержку других языков через i18n.
- **Расширяемость**: Структура проекта позволяет легко добавлять новые модули (например, аналитику для администраторов).
- **Ограничения**: Текущая версия работает с локальными данными. Для масштабирования потребуется серверная часть (Node.js, Django и т.д.).
- **Тестирование**: Рекомендуется добавить юнит-тесты (Jest) и e2e-тесты (Cypress) для проверки функциональности.