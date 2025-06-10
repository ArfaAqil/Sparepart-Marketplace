# Документация: Модуль администратора (`dashboard/admin`)

## Обзор

Модуль `dashboard/admin` предназначен для пользователей с ролью «администратор» на платформе электронной коммерции автозапчастей. Он предоставляет функционал для модерации товаров, управления пользователями, обработки заказов, аналитики платформы и настройки параметров системы. Модуль интегрирован с данными из файлов `products.json`, `orders.json` и `users.json`, а также использует `localStorage` для хранения изменений на стороне клиента. Интерфейс полностью на русском языке и имеет адаптивный дизайн.

```javascript
// Пример структуры данных пользователя в localStorage
const userData = {
    username: "admin",
    email: "admin@example.com",
    role: "admin",
    blocked: false
};
localStorage.setItem('userData', JSON.stringify(userData));
```

## Структура директории

```
dashboard/admin/
├── analytics/
│   ├── index.html         # Страница аналитики платформы
│   ├── style.css          # Стили для аналитики
│   └── script.js          # Логика аналитики
├── orders/
│   ├── index.html         # Страница управления заказами
│   ├── style.css          # Стили для заказов
│   └── script.js          # Логика управления заказами
├── products/
│   ├── index.html         # Страница модерации товаров
│   ├── style.css          # Стили для модерации
│   └── script.js          # Логика модерации товаров
├── settings/
│   ├── index.html         # Страница настроек платформы
│   ├── style.css          # Стили для настроек
│   └── script.js          # Логика настроек
├── users/
│   ├── index.html         # Страница управления пользователями
│   ├── style.css          # Стили для пользователей
│   └── script.js          # Логика управления пользователями
├── index.html             # Главная страница администратора
├── style.css              # Общие стили
└── script.js              # Логика главной страницы
```

## Основные компоненты

### 1. `index.html` (Главная страница администратора)

**Описание**: Главная страница администратора, предоставляющая доступ к основным функциям администрирования.

**Функции**:
- Отображение приветственного сообщения с именем администратора.
- Навигация по разделам: модерация товаров, управление пользователями, управление заказами, аналитика и настройки.
- Выход из системы с удалением `userData`.

**Основные элементы**:
- `.dashboard-header`: Заголовок с логотипом и навигацией.
- `.admin-actions`: Контейнер с кнопками для перехода в разделы.
- `#displayUsername`: Поле для отображения имени администратора.
- `.logout-btn`: Кнопка выхода из системы.

**Код**:
```html
<div class="admin-actions">
    <a href="products/index.html" class="action-btn"><i class="fas fa-cogs"></i> Модерация товаров</a>
    <a href="users/index.html" class="action-btn"><i class="fas fa-users"></i> Управление пользователями</a>
    <a href="orders/index.html" class="action-btn"><i class="fas fa-box"></i> Управление заказами</a>
    <a href="analytics/index.html" class="action-btn"><i class="fas fa-chart-bar"></i> Аналитика платформы</a>
    <a href="settings/index.html" class="action-btn"><i class="fas fa-cog"></i> Настройки платформы</a>
</div>
```

**Примечание**: Доступ к модулю защищён проверкой роли администратора в `userData`.

### 2. `script.js` (Логика главной страницы)

**Описание**: Управляет загрузкой пользовательских данных и выходом из системы.

**Функции**:
- Загрузка имени администратора из `userData` в `localStorage`.
- Обработка выхода из системы с удалением `userData` и перенаправлением на страницу авторизации.

**Код**:
```javascript
document.addEventListener('DOMContentLoaded', function() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (userData.username) {
        document.getElementById('displayUsername').textContent = userData.username;
    }
    document.querySelector('.logout-btn').addEventListener('click', function() {
        localStorage.removeItem('userData');
        window.location.href = '../../auth/index.html';
    });
});
```

**Примечание**: Проверяется наличие `userData` для отображения имени, иначе используется значение по умолчанию «Администратор».

### 3. `products/index.html` (Страница модерации товаров)

**Описание**: Страница для просмотра и модерации товаров, добавленных продавцами.

**Функции**:
- Отображение списка товаров в виде карточек с изображением, названием, ценой, категорией, статусом и продавцом.
- Фильтрация по категории, статусу (ожидает модерации, одобрено, отклонено) и продавцу.
- Модальное окно для просмотра деталей товара с каруселью изображений.
- Модальное окно для редактирования товара.
- Действия: одобрение, отклонение или удаление товаров.

**Основные элементы**:
- `#productList`: Контейнер для карточек товаров.
- `#categoryFilter`, `#statusFilter`, `#sellerFilter`: Поля для фильтрации.
- `#productModal`: Модальное окно для просмотра деталей.
- `#editProductModal`: Модальное окно для редактирования.

**Код**:
```html
<div class="products-filters">
    <select id="categoryFilter" class="filter-select">
        <option value="all">Все категории</option>
        <option value="Тормоза">Тормоза</option>
        <!-- Другие категории -->
    </select>
    <select id="statusFilter" class="filter-select">
        <option value="all">Все статусы</option>
        <option value="pending">Ожидает модерации</option>
        <option value="approved">Одобрено</option>
        <option value="rejected">Отклонено</option>
    </select>
    <input type="text" id="sellerFilter" placeholder="Поиск по продавцу" class="filter-select">
</div>
```

**Статусы товаров**:
- `pending`: Ожидает модерации.
- `approved`: Одобрено.
- `rejected`: Отклонено.

**Примечание**: Удаление доступно только для товаров со статусом `pending`.

### 4. `products/script.js` (Логика модерации товаров)

**Описание**: Управляет загрузкой, фильтрацией и модерацией товаров.

**Функции**:
- Загрузка товаров из `products.json` и `localStorage` с дедупликацией по `id`.
- Нормализация статуса товаров (`pending`, `approved`, `rejected`).
- Рендеринг карточек товаров с изображениями и кнопками действий.
- Фильтрация по категории, статусу и продавцу.
- Модальное окно для просмотра деталей с каруселью изображений.
- Редактирование товаров через форму с валидацией.
- Действия: одобрение, отклонение, удаление товаров.

**Код**:
```javascript
function renderProducts(productsToRender) {
    const filteredProducts = productsToRender.filter(product => {
        const matchesCategory = categoryFilter.value === 'all' || product.category === categoryFilter.value;
        const matchesStatus = statusFilter.value === 'all' || product.status === statusFilter.value;
        const matchesSeller = !sellerFilter.value || product.seller?.toLowerCase().includes(sellerFilter.value.toLowerCase());
        return matchesCategory && matchesStatus && matchesSeller;
    });
    productList.innerHTML = filteredProducts.map(product => `
        <div class="product-card status-${product.status}" data-product-id="${product.id}">
            <div class="product-image">
                <img src="${product.images[0].replace('../../', '../../../')}" alt="${product.name}" 
                     onerror="this.src='https://via.placeholder.com/150?text=No+Image'">
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p>Цена: ${product.price.toLocaleString('ru-RU')} ₽</p>
                <p>Категория: ${product.category}</p>
                <p>Статус: ${product.status === 'pending' ? 'Ожидает модерации' : 
                              product.status === 'approved' ? 'Одобрено' : 'Отклонено'}</p>
            </div>
            <div class="product-actions">
                <button class="btn approve-btn" data-id="${product.id}">
                    ${product.status === 'approved' ? 'Одобрено' : 'Одобрить'}
                </button>
                <button class="btn reject-btn" data-id="${product.id}">
                    ${product.status === 'rejected' ? 'Отклонено' : 'Отклонить'}
                </button>
                <button class="btn edit-btn" data-id="${product.id}">Редактировать</button>
                ${product.status === 'pending' ? `
                    <button class="btn delete-btn" data-id="${product.id}">Удалить</button>
                ` : ''}
            </div>
        </div>
    `).join('');
}
```

**Примечание**: Изображения загружаются из `../../../Images/`, с заглушкой при отсутствии.

### 5. `users/index.html` (Страница управления пользователями)

**Описание**: Страница для управления учетными записями пользователей.

**Функции**:
- Отображение списка пользователей в виде карточек с информацией: имя, email, роль, статус (активен/заблокирован).
- Фильтрация по роли и поиск по имени/email.
- Действия: блокировка/разблокировка, сброс пароля, изменение роли, удаление пользователя.

**Основные элементы**:
- `#userList`: Контейнер для карточек пользователей.
- `#roleFilter`, `#searchFilter`: Поля для фильтрации.

**Код**:
```html
<div class="users-filters">
    <select id="roleFilter" class="filter-select">
        <option value="all">Все роли</option>
        <option value="buyer">Покупатель</option>
        <option value="seller">Продавец</option>
        <option value="admin">Админ</option>
    </select>
    <input type="text" id="searchFilter" placeholder="Поиск по имени или email" class="filter-select">
</div>
```

**Примечание**: Статус блокировки хранится в `blockedUsers` в `localStorage`.

### 6. `users/script.js` (Логика управления пользователями)

**Описание**: Управляет загрузкой, фильтрацией и действиями с пользователями.

**Функции**:
- Загрузка пользователей из `users.json` и `localStorage` с учётом статуса блокировки.
- Рендеринг карточек пользователей.
- Фильтрация по роли и поиску.
- Действия: блокировка/разблокировка, сброс пароля (генерация временного), изменение роли, удаление.

**Код**:
```javascript
function renderUsers(usersToRender) {
    const filteredUsers = usersToRender.filter(user => {
        const matchesRole = roleFilter.value === 'all' || user.role === roleFilter.value;
        const matchesSearch = !searchFilter.value || 
            user.username.toLowerCase().includes(searchFilter.value.toLowerCase()) || 
            user.email.toLowerCase().includes(searchFilter.value.toLowerCase());
        return matchesRole && matchesSearch;
    });
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
```

**Примечание**: Сброс пароля генерирует временный пароль вида `tempXXXXXXXX`.

### 7. `orders/index.html` (Страница управления заказами)

**Описание**: Страница для просмотра и управления всеми заказами платформы.

**Функции**:
- Отображение заказов в виде раскрывающихся карточек с номером, датой, статусом, клиентом и суммой.
- Фильтрация по статусу, дате и поиску (по номеру заказа или имени клиента).
- Просмотр деталей заказа: клиент, товары, оплата.
- Изменение статуса заказа и удаление.

**Основные элементы**:
- `#orderList`: Контейнер для карточек заказов.
- `#statusFilter`, `#dateFilter`, `#searchFilter`: Поля для фильтрации.

**Код**:
```html
<div class="orders-filters">
    <select id="statusFilter" class="filter-select">
        <option value="all">Все статусы</option>
        <option value="Ожидает оплаты">Ожидает оплаты</option>
        <!-- Другие статусы -->
    </select>
    <input type="date" id="dateFilter" class="filter-select">
    <input type="text" id="searchFilter" placeholder="Поиск по номеру или клиенту" class="filter-select">
</div>
```

**Статусы**:
- Ожидает оплаты
- Оплачено
- Оплата при получении
- В обработке
- Отправлено
- Доставлено
- Отменен

### 8. `orders/script.js` (Логика управления заказами)

**Описание**: Управляет загрузкой, фильтрацией и обработкой заказов.

**Функции**:
- Загрузка заказов из `orders.json` и `localStorage` с дедупликацией по `orderNumber`.
- Рендеринг карточек заказов с деталями клиента, оплаты и товаров.
- Фильтрация по статусу, дате и поиску.
- Изменение статуса заказа с подтверждением.
- Удаление заказа с подтверждением.

**Код**:
```javascript
function renderOrders(ordersToRender) {
    const filteredOrders = ordersToRender.filter(order => {
        const matchesStatus = statusFilter.value === 'all' || order.status === statusFilter.value;
        const matchesDate = !dateFilter.value || new Date(order.date).toISOString().split('T')[0] === dateFilter.value;
        const matchesSearch = !searchFilter.value || 
            order.orderNumber.toLowerCase().includes(searchFilter.value.toLowerCase()) ||
            order.customer.fullName.toLowerCase().includes(searchFilter.value.toLowerCase());
        return matchesStatus && matchesDate && matchesSearch;
    });
    orderList.innerHTML = filteredOrders.map(order => `
        <div class="order-card">
            <div class="order-header" onclick="toggleOrderDetails(this)">
                <div class="order-meta">
                    <span class="order-number">Заказ #${order.orderNumber}</span>
                    <span class="order-date">${formatDate(order.date)}</span>
                    <span class="order-status">${order.status}</span>
                </div>
                <div class="order-summary">
                    <span>${order.customer.fullName}</span>
                    <span class="order-total">${order.paymentAmount.toLocaleString('ru-RU')} ₽</span>
                </div>
            </div>
            <!-- Детали заказа -->
        </div>
    `).join('');
}
```

**Примечание**: Изображения товаров в заказах загружаются из `../../../Images/`.

### 9. `analytics/index.html` (Страница аналитики платформы)

**Описание**: Страница для просмотра аналитических данных платформы.

**Функции**:
- Отображение статистики: заказы по категориям (график), активность пользователей, популярные товары.
- Экспорт данных в Excel: пользователи и товары, полный отчёт.
- График заказов по категориям с помощью Chart.js.

**Основные элементы**:
- `#ordersByCategoryChart`: График заказов по категориям.
- `#userActivity`: Блок активности пользователей.
- `#popularProducts`: Блок популярных товаров.
- `#exportUsersProductsBtn`, `#exportReportBtn`: Кнопки экспорта.

**Код**:
```html
<div class="analytics-grid">
    <div class="analytics-card">
        <h3>Заказы по категориям</h3>
        <canvas id="ordersByCategoryChart"></canvas>
    </div>
    <div class="analytics-card">
        <h3>Активность пользователей</h3>
        <div id="userActivity"></div>
    </div>
    <div class="analytics-card">
        <h3>Популярные товары</h3>
        <div id="popularProducts"></div>
    </div>
</div>
```

**Примечание**: График использует категории: Тормоза, Подвеска, Двигатель, Фильтры, Смазки.

### 10. `analytics/script.js` (Логика аналитики)

**Описание**: Управляет загрузкой данных и отображением аналитики.

**Функции**:
- Загрузка пользователей, товаров и заказов из `users.json`, `products.json`, `orders.json` и `localStorage`.
- Рендеринг графика заказов по категориям с помощью Chart.js.
- Отображение активности пользователей (заказы покупателей, товары продавцов).
- Отображение топ-5 популярных товаров по количеству заказов и выручке.
- Экспорт данных в Excel: пользователи и товары, полный отчёт (категории, товары, пользователи).

**Код**:
```javascript
function renderAnalytics() {
    const categories = ['Тормоза', 'Подвеска', 'Двигатель', 'Фильтры', 'Смазки'];
    const orderCounts = categories.map(cat => 
        orders.reduce((count, order) => 
            count + order.items.filter(item => getProductCategory(item) === cat).length, 0)
    );
    new Chart(document.getElementById('ordersByCategoryChart'), {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [{
                label: 'Количество позиций в заказах',
                data: orderCounts,
                backgroundColor: ['#6a1b9a', '#ab47bc', '#ff4081', '#4a148c', '#ce93d8']
            }]
        }
    });
}
```

**Примечание**: Экспорт создаёт файлы вида `users_and_products_YYYYMMDD.xlsx` и `admin_report_YYYYMMDD.xlsx`.

### 11. `settings/index.html` (Страница настроек платформы)

**Описание**: Страница для настройки параметров платформы, таких как стоимость доставки.

**Функции**:
- Форма для изменения минимальной стоимости доставки, коэффициентов по весу и расстоянию.
- Сохранение настроек в `localStorage`.

**Основные элементы**:
- `#settingsForm`: Форма настроек.
- `#minShippingCost`, `#weightCoefficient`, `#distanceCoefficient`: Поля ввода.

**Код**:
```html
<form id="settingsForm">
    <div class="form-group">
        <label for="minShippingCost">Минимальная стоимость доставки (₽)</label>
        <input type="number" id="minShippingCost" value="1000" min="0" step="100">
    </div>
    <button type="submit" class="btn">Сохранить</button>
</form>
```

**Примечание**: Значения по умолчанию: 1000 ₽ (минимальная стоимость), 100 ₽/кг, 0.15 ₽/км.

### 12. `settings/script.js` (Логика настроек)

**Описание**: Управляет загрузкой и сохранением настроек платформы.

**Функции**:
- Загрузка текущих настроек из `localStorage`.
- Сохранение новых значений в `platformSettings`.
- Уведомление о сохранении настроек.

**Код**:
```javascript
settingsForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const newSettings = {
        minShippingCost: parseFloat(document.getElementById('minShippingCost').value),
        weightCoefficient: parseFloat(document.getElementById('weightCoefficient').value),
        distanceCoefficient: parseFloat(document.getElementById('distanceCoefficient').value)
    };
    localStorage.setItem('platformSettings', JSON.stringify(newSettings));
    alert('Настройки сохранены');
});
```

## Зависимости

- **Font Awesome 6.0.0**: Для иконок (навигация, действия, фильтры).
- **Chart.js 3.9.1**: Для графиков в аналитике.
- **XLSX 0.18.5**: Для экспорта данных в Excel.
- **Данные**:
  - `auth/data/users.json`
  - `dashboard/buyer/data/products.json`
  - `dashboard/buyer/data/orders.json`
  - `localStorage`: Хранение пользователей, товаров, заказов и настроек.

**Код**:
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
```

## Инструкция по использованию

1. **Вход**: Авторизация через `auth/index.html` с ролью администратора, сохранение `userData` в `localStorage`.
2. **Модерация товаров**:
   - Перейти на `products/index.html`.
   - Фильтровать товары по категории, статусу или продавцу.
   - Одобрить, отклонить или отредактировать товары.
   - Удалить товары со статусом `pending`.
3. **Управление пользователями**:
   - Перейти на `users/index.html`.
   - Фильтровать пользователей по роли или поиску.
   - Заблокировать/разблокировать, сбросить пароль, изменить роль или удалить.
4. **Управление заказами**:
   - Перейти на `orders/index.html`.
   - Фильтровать заказы по статусу, дате или поиску.
   - Изменить статус или удалить заказ.
5. **Аналитика**:
   - Перейти на `analytics/index.html`.
   - Просмотреть график заказов, активность пользователей и популярные товары.
   - Экспортировать данные в Excel.
6. **Настройки**:
   - Перейти на `settings/index.html`.
   - Изменить параметры доставки и сохранить.
7. **Выход**: Нажать «Выйти» для удаления `userData` и возвращения на `auth/index.html`.

**Код**:
```javascript
document.querySelector('.logout-btn').addEventListener('click', function() {
    localStorage.removeItem('userData');
    window.location.href = '../../../auth/index.html';
});
```

## Тестирование

### Сценарии тестирования
1. **Модерация товаров**:
   - Проверить загрузку товаров из `products.json` и `localStorage`.
   - Применить фильтры (категория, статус, продавец) и проверить результаты.
   - Одобрить/отклонить товар, убедиться в изменении статуса.
   - Отредактировать товар, проверить сохранение изменений.
   - Удалить товар со статусом `pending`.
2. **Управление пользователями**:
   - Проверить загрузку пользователей из `users.json` и `localStorage`.
   - Фильтровать по роли и поиску.
   - Заблокировать/разблокировать пользователя, проверить статус.
   - Сбросить пароль, убедиться в генерации временного пароля.
   - Изменить роль пользователя, проверить обновление.
   - Удалить пользователя, убедиться в удалении.
3. **Управление заказами**:
   - Проверить загрузку заказов из `orders.json` и `localStorage`.
   - Фильтровать по статусу, дате и поиску.
   - Изменить статус заказа, проверить обновление.
   - Удалить заказ, убедиться в удалении.
4. **Аналитика**:
   - Проверить отображение графика заказов по категориям.
   - Убедиться в корректности данных активности пользователей и популярных товаров.
   - Экспортировать отчёты в Excel, проверить содержимое файлов.
5. **Настройки**:
   - Изменить параметры доставки, проверить сохранение в `localStorage`.
   - Убедиться, что значения загружаются корректно при открытии страницы.