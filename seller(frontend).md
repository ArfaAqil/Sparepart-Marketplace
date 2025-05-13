# Документация: Модуль продавца (`dashboard/seller`)

## Обзор

Модуль `dashboard/seller` предназначен для пользователей с ролью «продавец» на платформе электронной коммерции автозапчастей. Он позволяет продавцам управлять продуктами (добавление, редактирование, удаление), обрабатывать заказы и отслеживать статус доставки. Модуль интегрирован с данными из файлов `products.json` и `orders.json`, а также использует `localStorage` для временного хранения изменений на стороне клиента. Интерфейс пользователя поддерживает русский язык и имеет адаптивный дизайн.

```javascript
// Пример структуры данных продукта в localStorage
const newProduct = {
    id: Date.now().toString(),
    name: "Тормозные колодки",
    price: 2500.00,
    images: ["../../Images/brake_pads.jpg"],
    // ... другие атрибуты
};
```

## Структура директории

```
dashboard/seller/
├── order/
│   ├── index.html         # Страница списка заказов
│   ├── style.css          # Стили для страницы заказов
│   └── script.js          # Логика управления заказами
├── process-order/
│   ├── index.html         # Страница обработки заказа
│   ├── style.css          # Стили для страницы обработки
│   └── script.js          # Логика обновления статуса заказа
├── shipping/
│   ├── index.html         # Страница списка доставок
│   ├── style.css          # Стили для страницы доставок
│   └── script.js          # Логика управления доставками
├── index.html             # Главная страница продавца
├── style.css              # Стили для главной страницы
└── script.js              # Логика управления продуктами
```

## Основные компоненты

### 1. `index.html` (Главная страница продавца)

**Описание**: Главная страница продавца, отображающая список продуктов и предоставляющая инструменты для их управления.

**Функции**:
- Отображение продуктов в виде карточек с изображением, названием и ценой.
- Кнопка для добавления нового продукта.
- Ссылки на просмотр заказов (`order/index.html`) и доставок (`shipping/index.html`).
- Модальное окно для добавления/редактирования продуктов.
- Модальное окно для просмотра деталей продукта с каруселью изображений.

**Основные элементы**:
- `.product-grid`: Контейнер для карточек продуктов.
- `#addProductBtn`: Кнопка для открытия модального окна добавления.
- `#productModal`: Модальное окно для просмотра деталей.
- `#editProductModal`: Модальное окно для добавления/редактирования.

**Код**:
```html
<div class="seller-actions">
    <button id="addProductBtn" class="action-btn"><i class="fas fa-plus"></i> Добавить продукт</button>
    <a href="order/index.html" class="action-btn"><i class="fas fa-box"></i> Просмотреть заказы</a>
</div>
<div class="product-grid" id="productGrid"></div>
```

**Примечание**: Отсутствует фильтрация продуктов по продавцу, отображаются все продукты из `products.json` и `localStorage`.

### 2. `script.js` (Логика управления продуктами)

**Описание**: Управляет логикой для работы с продуктами на главной странице продавца.

**Функции**:
- Загрузка продуктов из `products.json` и `localStorage` с дедупликацией по `id`.
- Рендеринг карточек продуктов с изображениями и кнопками действий.
- Модальное окно для добавления/редактирования с полной формой.
- Удаление продуктов из `localStorage`.
- Отображение деталей продукта с каруселью изображений.
- Выход из системы с удалением `userData`.

**Код**:
```javascript
// Рендеринг продуктов
function renderProducts(products) {
    productGrid.innerHTML = products.map(product => `
        <div class="product-card" data-product-id="${product.id}">
            <div class="product-image">
                <img src="${product.images[0]}" alt="${product.name}" 
                     onerror="this.src='../../Images/placeholder.jpg'">
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <div class="product-price">${product.price.toLocaleString('ru-RU')} ₽</div>
                <div class="product-actions">
                    <button class="btn edit-btn" data-product-id="${product.id}">Редактировать</button>
                    <button class="btn btn-danger delete-btn" data-product-id="${product.id}">Удалить</button>
                </div>
            </div>
        </div>
    `).join('');
}
```

**Примечание**:
- Изображения продуктов ожидаются в `../../Images/`.
- При отсутствии изображения используется заглушка (`../../Images/placeholder.jpg`).

### 3. `order/index.html` (Страница списка заказов)

**Описание**: Отображает список заказов клиентов, доступных для управления продавцом.

**Функции**:
- Отображение заказов в виде раскрывающихся карточек.
- Фильтрация по статусу, дате и поиску (по номеру заказа или имени клиента).
- Кнопки для отмены, обработки или удаления заказа.
- Экспорт заказов в Excel с помощью `xlsx.js`.

**Основные элементы**:
- `#orderList`: Контейнер для карточек заказов.
- `#statusFilter`, `#dateFilter`, `#searchFilter`: Поля для фильтрации.
- `#exportExcelBtn`: Кнопка экспорта в Excel.
- `#refreshOrdersBtn`: Кнопка обновления списка.

**Код**:
```html
<div class="order-filters">
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
- Отменен

**Примечание**: Заказы со статусами «Отправлено» и «Доставлено» отображаются в `shipping/index.html`.

### 4. `order/script.js` (Логика управления заказами)

**Описание**: Управляет загрузкой, фильтрацией и обработкой заказов.

**Функции**:
- Загрузка заказов из `orders.json` и `localStorage` с нормализацией статусов.
- Фильтрация заказов по статусу, дате и поиску.
- Рендеринг карточек заказов с деталями клиента и оплаты.
- Действия: отмена, начало обработки, удаление.
- Экспорт всех заказов в Excel.

**Код**:
```javascript
// Нормализация статуса
function normalizeStatus(status) {
    const statusMap = {
        'ожидает оплаты': 'Ожидает оплаты',
        'оплачено': 'Оплачено',
        // ... другие статусы
    };
    return statusMap[status?.trim().toLowerCase()] || 'Ожидает оплаты';
}
```

**Примечание**: Изображения товаров в заказах берутся из `../../../Images/[имя_продукта]/[имя_изображения]`.

### 5. `process-order/index.html` (Страница обработки заказа)

**Описание**: Страница для обновления статуса конкретного заказа.

**Функции**:
- Отображение деталей заказа (клиент, оплата, товары, номер отслеживания, заметки).
- Форма для обновления статуса, номера отслеживания и заметок продавца.
- Последовательная логика изменения статусов.

**Основные элементы**:
- `#orderNumber`: Отображает номер заказа.
- `#orderDetails`: Контейнер для деталей заказа.
- `#processOrderForm`: Форма для обновления статуса.

**Код**:
```html
<form id="processOrderForm">
    <div class="form-group">
        <label for="newStatus">Новый статус:</label>
        <select id="newStatus" name="newStatus" required>
            <option value="В обработке">В обработке</option>
            <option value="Отправлено">Отправлено</option>
            <option value="Доставлено">Доставлено</option>
        </select>
    </div>
    <div class="form-group">
        <label for="trackingNumber">Номер отслеживания:</label>
        <input type="text" id="trackingNumber" name="trackingNumber">
    </div>
</form>
```

**Статусы**:
- Из «Оплачено»/«Оплата при получении» → «В обработке».
- Из «В обработке» → «Отправлено» (требуется номер отслеживания).
- Из «Отправлено» → «Доставлено» (с двойным подтверждением).

### 6. `process-order/script.js` (Логика обработки заказа)

**Описание**: Управляет загрузкой и обновлением деталей заказа.

**Функции**:
- Загрузка деталей заказа по `orderNumber` из URL.
- Отображение деталей заказа.
- Обновление статуса, номера отслеживания и заметок в `localStorage`.
- Валидация номера отслеживания для «Отправлено».
- Двойное подтверждение для «Доставлено».

**Код**:
```javascript
processOrderForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const newStatus = newStatusSelect.value;
    if (newStatus === 'Отправлено' && !trackingNumberInput.value) {
        alert('Укажите номер отслеживания для статуса "Отправлено".');
        return;
    }
    updateOrderStatus(orderNumber, newStatus, trackingNumberInput.value, sellerNotesInput.value);
});
```

**Примечание**: Форма блокируется для статусов, не допускающих изменений.

### 7. `shipping/index.html` (Страница списка доставок)

**Описание**: Отображает заказы со статусами «Отправлено» или «Доставлено».

**Функции**:
- Отображение заказов в виде раскрывающихся карточек.
- Фильтрация по статусу, дате и поиску.
- Кнопка для подтверждения доставки.
- Кнопка для удаления заказа.

**Основные элементы**:
- `#shippingList`: Контейнер для карточек доставок.
- `#statusFilter`, `#dateFilter`, `#searchFilter`: Поля для фильтрации.
- `#refreshShippingBtn`: Кнопка обновления.

**Код**:
```html
<div class="shipping-filters">
    <select id="statusFilter" class="filter-select">
        <option value="all">Все статусы</option>
        <option value="Отправлено">Отправлено</option>
        <option value="Доставлено">Доставлено</option>
    </select>
</div>
```

### 8. `shipping/script.js` (Логика управления доставками)

**Описание**: Управляет загрузкой и обработкой заказов в доставке.

**Функции**:
- Загрузка заказов со статусами «Отправлено» или «Доставлено».
- Фильтрация заказов.
- Отображение деталей, включая номер отслеживания и заметки.
- Удаление заказов.

**Код**:
```javascript
// Фильтрация заказов
function renderOrders(ordersToRender) {
    const filteredOrders = ordersToRender.filter(order => {
        const matchesStatus = statusFilter.value === 'all' || order.status === statusFilter.value;
        const matchesDate = !dateFilter.value || new Date(order.date).toISOString().split('T')[0] === dateFilter.value;
        const matchesSearch = !searchFilter.value || 
            order.orderNumber.toLowerCase().includes(searchFilter.value.toLowerCase());
        return matchesStatus && matchesDate && matchesSearch;
    });
    // Рендеринг карточек
}
```

## Зависимости

- **Font Awesome 6.0.0**: Для иконок.
- **XLSX 0.18.5**: Для экспорта заказов в Excel (`order/script.js`).
- **Данные**:
  - `dashboard/buyer/data/products.json`
  - `dashboard/buyer/data/orders.json`
  - `localStorage` для хранения изменений.

**Код**:
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
```

## Инструкция по использованию

1. **Вход**: Авторизация через `auth/index.html`, сохранение `userData` в `localStorage`.
2. **Управление продуктами**:
   - Перейти на `seller/index.html`.
   - Добавить/редактировать продукты через модальное окно.
   - Удалить продукты с подтверждением.
3. **Управление заказами**:
   - Перейти на `order/index.html`.
   - Отменить или обработать заказы через `process-order/index.html`.
4. **Управление доставкой**:
   - Перейти на `shipping/index.html`.
   - Подтвердить доставку для заказов «Отправлено».
5. **Экспорт**: Использовать кнопку экспорта в `order/index.html`.
6. **Выход**: Удаление `userData` и переход на `auth/index.html`.

**Код**:
```javascript
document.querySelector('.logout-btn').addEventListener('click', function() {
    localStorage.removeItem('userData');
    window.location.href = '../../../auth/index.html';
});
```

## Тестирование

### Сценарии тестирования
1. **Управление продуктами**:
   - Добавить продукт, проверить сохранение в `localStorage`.
   - Редактировать продукт, убедиться в корректности изменений.
   - Удалить продукт, проверить удаление из списка.
2. **Управление заказами**:
   - Фильтровать заказы по статусу и поиску.
   - Отменить заказ со статусом «Ожидает оплаты».
   - Экспортировать заказы в Excel.
3. **Управление доставкой**:
   - Проверить отображение только заказов «Отправлено»/«Доставлено».
   - Подтвердить доставку для «Отправлено».