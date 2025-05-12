# Документация: Модуль покупателя (`dashboard/buyer`)

## Обзор

Модуль `dashboard/buyer` предназначен для пользователей с ролью «покупатель» на платформе электронной коммерции автозапчастей. Он предоставляет функционал для просмотра каталога товаров, фильтрации и поиска, управления корзиной, оформления заказов, а также просмотра истории заказов и статуса доставки. Модуль интегрирован с данными из файлов `products.json` и `orders.json`, использует `localStorage` для временного хранения данных (корзина, заказы, пользовательские данные). Интерфейс полностью на русском языке, адаптивен и использует современные веб-технологии.

```javascript
// Пример структуры данных корзины в localStorage
const cart = [
    {
        id: "1",
        name: "Тормозные колодки Toyota Corolla",
        price: 12500,
        quantity: 1,
        images: ["../../Images/Тормозные колодки Toyota Corolla/11.webp"],
        // ... другие атрибуты
    }
];
localStorage.setItem('cart', JSON.stringify(cart));
```

## Структура директории

```
dashboard/buyer/
├── cart/
│   ├── index.html         # Страница корзины
│   ├── style.css          # Стили для корзины
│   └── script.js          # Логика корзины
├── checkout/
│   ├── index.html         # Страница оформления заказа
│   ├── style.css          # Стили для оформления
│   └── script.js          # Логика оформления
├── data/
│   ├── orders.json        # Данные заказов
│   └── products.json      # Данные товаров
├── order/
│   ├── order-history.html # Страница истории заказов
│   ├── style.css          # Стили для истории
│   └── script.js          # Логика истории
├── shipping/
│   ├── index.html         # Страница доставки заказов
│   ├── style.css          # Стили для доставки
│   └── script.js          # Логика доставки
├── index.html             # Главная страница покупателя
├── style.css              # Общие стили
└── script.js              # Логика каталога
```

## Основные компоненты

### 1. `index.html` (Главная страница покупателя)

**Описание**: Главная страница каталога товаров, предоставляющая интерфейс для поиска, фильтрации и добавления товаров в корзину.

**Функции**:
- Отображение товаров в виде сетки карточек с изображениями, ценами, брендом, состоянием и рейтингом продавца.
- Поиск по названию или VIN-коду.
- Расширенные фильтры: марка, модель, год, цена, состояние, категория, наличие, гарантия, рейтинг продавца.
- Модальное окно для просмотра деталей товара с каруселью изображений.
- Добавление товаров в корзину с уведомлением.
- Навигация в корзину, историю заказов и выход из системы.

**Основные элементы**:
- `.product-grid`: Контейнер для карточек товаров.
- `#searchInput`: Поле поиска.
- `#filterSidebar`: Боковая панель фильтров.
- `#productModal`: Модальное окно для деталей товара.
- `.cart-icon-container`: Иконка корзины с счётчиком.

**Код**:
```html
<div class="dashboard-toolbar">
    <h1>Каталог запчастей</h1>
    <div class="search-filter-container">
        <div class="search-box">
            <input type="text" placeholder="Поиск по названию или VIN..." id="searchInput">
            <button class="search-btn" id="searchButton"><i class="fas fa-search"></i></button>
        </div>
        <button class="filter-toggle" id="filterToggle">
            <i class="fas fa-sliders-h"></i> Фильтры
        </button>
    </div>
</div>
<div class="product-grid" id="productGrid"></div>
```

**Примечание**: Фильтры динамически заполняются на основе данных товаров (бренды, модели, категории).

### 2. `script.js` (Логика каталога)

**Описание**: Управляет логикой загрузки, фильтрации и отображения товаров, а также корзиной.

**Функции**:
- **Загрузка товаров**: Из `products.json` и `localStorage`, с нормализацией данных и дедупликацией по `id`.
- **Нормализация данных**: Проверка структуры товаров, установка значений по умолчанию для отсутствующих свойств.
- **Фильтрация товаров**: Поиск по названию/VIN, фильтры по бренду, модели, году, цене, состоянию, категории, наличию, гарантии и рейтингу продавца.
- **Рендеринг товаров**: Карточки с изображениями, ценами и мета-информацией.
- **Модальное окно**: Отображение деталей товара с каруселью изображений и кнопкой добавления в корзину.
- **Управление корзиной**: Добавление товаров, обновление счётчика, сохранение в `localStorage`.
- **Выход из системы**: Удаление `userData` и переход на страницу авторизации.

**Код**:
```javascript
// Нормализация структуры товара
function normalizeProduct(product) {
    const defaultProduct = {
        id: String(product.id || Date.now()),
        name: product.name || 'Unnamed Product',
        price: parseFloat(product.price) || 0,
        images: Array.isArray(product.images) ? product.images : ['../../Images/placeholder.jpg'],
        // ... другие свойства
    };
    return defaultProduct;
}

// Рендеринг карточек товаров
function renderProducts(productsToRender) {
    productGrid.innerHTML = productsToRender.map(product => `
        <div class="product-card" data-id="${product.id}">
            <div class="product-image-container">
                <div class="product-image" id="productImage-${product.id}">
                    <img src="${product.images[0]}" alt="${product.name}" 
                         onerror="this.src='https://via.placeholder.com/300x225?text=No+Image'">
                </div>
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <div class="product-price">${product.price.toLocaleString('ru-RU')} ₽</div>
                <button class="add-to-cart">В корзину</button>
            </div>
        </div>
    `).join('');
}
```

**Примечание**: 
- Используется `console.warn` для логирования проблем с данными товаров.
- При отсутствии товаров отображается заглушка с примерным товаром.

### 3. `cart/index.html` (Страница корзины)

**Описание**: Страница для просмотра и управления содержимым корзины.

**Функции**:
- Отображение списка товаров с изображениями, ценами и количеством.
- Изменение количества товаров (увеличение/уменьшение).
- Удаление товаров из корзины.
- Расчёт стоимости: товары, доставка (на основе веса и расстояния), итого.
- Переход к оформлению заказа или возвращение в каталог.

**Основные элементы**:
- `#cartItems`: Контейнер для товаров корзины.
- `#subtotal`, `#shipping`, `#total`: Поля для отображения стоимости.
- `#checkoutBtn`: Кнопка для перехода к оформлению.

**Код**:
```html
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
        <div class="cart-actions">
            <a href="../index.html" class="back-btn">Вернуться в каталог</a>
            <button class="checkout-btn" id="checkoutBtn">Перейти к оформлению</button>
        </div>
    </div>
</div>
```

### 4. `cart/script.js` (Логика корзины)

**Описание**: Управляет содержимым корзины и расчётом стоимости.

**Функции**:
- Загрузка корзины из `localStorage`.
- Рендеринг товаров корзины с изображениями и контролами количества.
- Обновление количества товаров и удаление из корзины.
- Расчёт доставки: `вес × количество × 100 ₽ + расстояние × 15 ₽`, минимум 1000 ₽.
- Сохранение данных заказа в `orderSummary` для оформления.
- Обновление счётчика корзины в заголовке.

**Код**:
```javascript
// Расчёт итогов
function updateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const baseShipping = cart.reduce((sum, item) => sum + (item.weight * item.quantity * 100), 0);
    const distanceCost = currentDistance * 15;
    const shipping = Math.max(baseShipping + distanceCost, 1000);
    const total = subtotal + shipping;
    localStorage.setItem('orderSummary', JSON.stringify({
        items: cart.map(item => ({...item})),
        subtotal,
        shipping,
        total
    }));
}
```

**Примечание**: 
- Расстояние рассчитывается на основе выбора города (имитация API).
- При пустой корзине кнопка оформления заказа блокируется.

### 5. `checkout/index.html` (Страница оформления заказа)

**Описание**: Страница для ввода данных доставки и оплаты, а также подтверждения заказа.

**Функции**:
- Форма доставки: ФИО, телефон, email, город, адрес, дата доставки.
- Выбор оплаты: банковская карта или наложенный платёж (с комиссией 2%).
- Валидация формы: обязательные поля, формат email, телефона, данных карты.
- Генерация QR-кода для наложенного платежа.
- Отображение итогов заказа: товары, доставка, общая сумма.
- Подтверждение заказа с сохранением в историю.

**Основные элементы**:
- `#deliveryForm`: Форма доставки и оплаты.
- `#orderItems`: Контейнер для товаров заказа.
- `#orderSubtotal`, `#orderShipping`, `#orderTotal`: Поля итогов.

**Код**:
```html
<form id="deliveryForm">
    <div class="form-group">
        <label for="fullName">ФИО</label>
        <input type="text" id="fullName" required>
    </div>
    <div class="payment-methods">
        <div class="payment-method">
            <input type="radio" id="cardPayment" name="paymentMethod" value="card" checked>
            <label for="cardPayment">Банковская карта</label>
        </div>
        <div class="payment-method">
            <input type="radio" id="codPayment" name="paymentMethod" value="cod">
            <label for="codPayment">Наложенный платеж</label>
        </div>
    </div>
    <button type="submit" class="submit-order">Оформить заказ</button>
</form>
```

### 6. `checkout/script.js` (Логика оформления заказа)

**Описание**: Управляет процессом оформления заказа, валидацией и оплатой.

**Функции**:
- Загрузка данных заказа из `orderSummary`.
- Автозаполнение пользовательских данных, если доступны.
- Валидация формы: проверка email, телефона, данных карты (для оплаты картой).
- Обработка оплаты: симуляция для карты (с 10% шансом ошибки), QR-код для наложенного платежа.
- Сохранение заказа в `localStorage` (`orders`) и очистка корзины.
- Перенаправление в историю заказов после успеха.

**Код**:
```javascript
// Валидация формы
function validateForm() {
    const email = document.getElementById('email').value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert('Пожалуйста, введите корректный email');
        return false;
    }
    if (cardPayment.checked) {
        const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
        if (cardNumber.length !== 16 || !/^\d+$/.test(cardNumber)) {
            alert('Пожалуйста, введите корректный номер карты (16 цифр)');
            return false;
        }
    }
    return true;
}
```

**Примечание**:
- QR-код генерируется через внешний API (`qrserver.com`).
- Дата доставки по умолчанию — завтрашний день, с блокировкой прошлых дат.

### 7. `order/order-history.html` (Страница истории заказов)

**Описание**: Страница для просмотра истории заказов покупателя.

**Функции**:
- Отображение заказов в виде раскрывающихся карточек с мета-информацией (номер, дата, статус, сумма).
- Подробности заказа: состав, доставка, стоимость, действия (отмена/удаление).
- Фильтрация заказов по статусам: «Ожидает оплаты», «Оплачено», «Оплата при получении», «В обработке», «Отменен».

**Основные элементы**:
- `#orderList`: Контейнер для карточек заказов.
- `.order-card`: Карточка заказа с раскрывающимися деталями.

**Код**:
```html
<div class="order-list" id="orderList">
    <div class="order-card">
        <div class="order-header" onclick="toggleOrderDetails(this)">
            <div class="order-meta">
                <span class="order-number">Заказ #ORD-123456</span>
                <span class="order-status paid">Оплачено</span>
            </div>
        </div>
        <div class="order-details">
            <div class="order-items">
                <h3>Состав заказа:</h3>
                <!-- Детали товаров -->
            </div>
        </div>
    </div>
</div>
```

### 8. `order/script.js` (Логика истории заказов)

**Описание**: Управляет загрузкой и отображением заказов, а также действиями с ними.

**Функции**:
- Загрузка заказов из `orders.json` и `localStorage` с нормализацией статусов.
- Рендеринг заказов с деталями: товары, информация о доставке, стоимость.
- Отмена заказов (для статусов, допускающих отмену).
- Удаление заказов из истории.
- Сортировка заказов по дате (от новых к старым).

**Код**:
```javascript
// Отмена заказа
function cancelOrder(orderId) {
    if (confirm('Вы уверены, что хотите отменить этот заказ?')) {
        let orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const updatedOrders = orders.map(order => 
            order.orderNumber === orderId ? { ...order, status: 'Отменен' } : order
        );
        localStorage.setItem('orders', JSON.stringify(updatedOrders));
        window.location.reload();
    }
}
```

**Примечание**: 
- Заказы с недопустимыми статусами фильтруются.
- Кнопка отмены блокируется для статусов «Отменен» и «В обработке».

### 9. `shipping/index.html` (Страница доставки заказов)

**Описание**: Страница для просмотра заказов со статусами «Отправлено» и «Доставлено».

**Функции**:
- Отображение заказов в виде раскрывающихся карточек.
- Показ деталей: товары, информация о доставке (включая номер отслеживания), заметки продавца.
- Возможность удаления заказа из истории.

**Основные элементы**:
- `#shippingList`: Контейнер для карточек доставки.
- `.order-card`: Карточка заказа с деталями.

**Код**:
```html
<div class="shipping-list" id="shippingList">
    <div class="order-card">
        <div class="order-header" onclick="toggleOrderDetails(this)">
            <div class="order-meta">
                <span class="order-number">Заказ #ORD-123456</span>
                <span class="order-status shipped">Отправлено</span>
            </div>
        </div>
        <div class="order-details">
            <div class="order-info-section">
                <p><strong>Номер отслеживания:</strong> TRK-123456</p>
            </div>
        </div>
    </div>
</div>
```

### 10. `shipping/script.js` (Логика доставки заказов)

**Описание**: Управляет загрузкой и отображением заказов в доставке.

**Функции**:
- Загрузка заказов из `orders.json` и `localStorage`, фильтрация по статусам «Отправлено» и «Доставлено».
- Рендеринг заказов с деталями: товары, доставка, заметки продавца.
- Удаление заказов из истории.
- Сортировка по дате (от новых к старым).

**Код**:
```javascript
// Удаление заказа
function deleteOrder(orderId) {
    if (confirm('Вы уверены, что хотите удалить этот заказ из истории?')) {
        let orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const updatedOrders = orders.filter(order => order.orderNumber !== orderId);
        localStorage.setItem('orders', JSON.stringify(updatedOrders));
        window.location.reload();
    }
}
```

**Примечание**: При отсутствии заказов отображается сообщение с ссылкой на каталог.

## Зависимости

- **Font Awesome 6.0.0**: Для иконок (поиск, корзина, фильтры, выход и т.д.).
- **QR Server API**: Для генерации QR-кодов при выборе наложенного платежа.
- **Данные**:
  - `dashboard/buyer/data/products.json`: Данные товаров.
  - `dashboard/buyer/data/orders.json`: Данные заказов.
  - `localStorage`: Хранение корзины, заказов и пользовательских данных.

**Код**:
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=COD-123456" alt="QR код">
```

## Инструкции по использованию

1. **Авторизация**: Войдите как покупатель через `auth/index.html`, данные сохраняются в `userData`.
2. **Просмотр каталога**:
   - Перейдите на `index.html`.
   - Используйте поиск и фильтры для нахождения товаров.
   - Нажмите на карточку товара для просмотра деталей или добавьте в корзину.
3. **Управление корзиной**:
   - Перейдите на `cart/index.html`.
   - Измените количество товаров или удалите их.
   - Нажмите «Перейти к оформлению» для продолжения.
4. **Оформление заказа**:
   - На `checkout/index.html` заполните данные доставки и выберите способ оплаты.
   - Подтвердите заказ, после чего он сохраняется в историю.
5. **Просмотр истории**:
   - На `order/order-history.html` просмотрите заказы, отмените или удалите их.
6. **Отслеживание доставки**:
   - На `shipping/index.html` просмотрите заказы в доставке с номерами отслеживания.
7. **Выход**: Нажмите «Выйти» для удаления `userData` и возвращения на страницу авторизации.

**Код**:
```javascript
document.querySelector('.logout-btn').addEventListener('click', function() {
    localStorage.removeItem('userData');
    window.location.href = '../../auth/index.html';
});
```

## Тестирование

### Сценарии тестирования
1. **Каталог товаров**:
   - Проверить загрузку товаров из `products.json` и `localStorage`.
   - Применить фильтры (бренд, цена, категория) и проверить корректность результатов.
   - Открыть модальное окно товара, проверить карусель изображений.
   - Добавить товар в корзину, убедиться в появлении уведомления.
2. **Корзина**:
   - Изменить количество товаров, проверить пересчёт итогов.
   - Удалить товар, убедиться, что он исчез из корзины.
   - Проверить расчёт доставки при выборе разных городов.
3. **Оформление заказа**:
   - Заполнить форму доставки, проверить валидацию (email, телефон, карта).
   - Выбрать оплату картой, проверить обработку платежа.
   - Выбрать наложенный платёж, убедиться в генерации QR-кода.
   - Подтвердить заказ, проверить сохранение в историю.
4. **История заказов**:
   - Проверить отображение заказов с корректными статусами.
   - Отменить заказ, убедиться в изменении статуса.
   - Удалить заказ, проверить его исчезновение.
5. **Доставка**:
   - Проверить отображение только заказов со статусами «Отправлено»/«Доставлено».
   - Убедиться, что номер отслеживания и заметки продавца отображаются.