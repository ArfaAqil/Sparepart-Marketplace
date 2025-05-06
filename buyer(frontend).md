# Документация: Модуль покупателя (`dashboard/buyer`)

## Обзор

Модуль `dashboard/buyer` предоставляет функционал для пользователей с ролью «покупатель». Он включает каталог товаров, корзину, оформление заказа и просмотр истории заказов. Модуль интегрирован с данными из `products.json`, `orders.json` и `localStorage`.

## Структура

```
dashboard/buyer/
├── data/
│   ├── orders.json     # Данные заказов
│   └── products.json   # Данные товаров
├── checkout/
│   ├── index.html      # Страница оформления заказа
│   ├── style.css       # Стили для оформления
│   └── script.js       # Логика оформления
├── order/
│   ├── order-history.html # Страница истории заказов
│   ├── style.css         # Стили для истории
│   └── script.js         # Логика истории
├── cart/
│   ├── index.html      # Страница корзины
│   ├── style.css       # Стили для корзины
│   └── script.js       # Логика корзины
├── index.html          # Главная страница покупателя
├── style.css           # Общие стили
└── script.js           # Логика каталога
```

### `data/`

- `products.json`:
  - Хранит данные товаров (название, цена, бренд, модель, год, категория и т.д.).
  - Формат:

    ```json
    [
      {
        "id": "1",
        "name": "Тормозные колодки",
        "price": 2500,
        "brand": "Toyota",
        "model": "Corolla",
        "year": 2020,
        "category": "Тормоза",
        "condition": "new",
        "images": ["../../Images/placeholder.jpg"],
        ...
      }
    ]
    ```
- `orders.json`:
  - Хранит данные заказов (номер заказа, статус, товары, клиент и т.д.).
  - Формат:

    ```json
    [
      {
        "orderNumber": "ORD-123456",
        "status": "Оплачено",
        "date": "2025-04-29T10:00:00Z",
        "items": [...],
        "customer": {...},
        "paymentAmount": 5000
      }
    ]
    ```

### `index.html`

- **Описание**: Главная страница покупателя с каталогом товаров.
- **Функции**:
  - Отображение товаров в виде сетки.
  - Поиск и фильтрация товаров (не полностью реализованы).
  - Добавление товаров в корзину.
  - Навигация в корзину и историю заказов.
- **Элементы**:
  - `.product-grid`: Контейнер для карточек товаров.
  - `.cart-icon-container`: Иконка корзины с счётчиком.

### `script.js`

- **Описание**: Логика каталога товаров.
- **Функции**:
  - Загрузка товаров из `products.json` и `localStorage`.
  - Отображение товаров с изображениями, ценами и действиями (добавить в корзину).
  - Управление корзиной через `localStorage`.
  - Обновление счётчика корзины.
- **Код**:

  ```javascript
  async function loadProducts() {
      let products = [];
      try {
          const response = await fetch('../buyer/data/products.json');
          const jsonProducts = await response.json();
          const localProducts = JSON.parse(localStorage.getItem('products') || '[]');
          products = Array.from(new Map([...jsonProducts, ...localProducts].map(p => [p.id, p])).values());
      } catch (e) {
          products = JSON.parse(localStorage.getItem('products') || '[]');
      }
      return products;
  }
  
  function renderProducts(products) {
      productGrid.innerHTML = products.map(product => `
          <div class="product-card">
              <img src="${product.images[0]}" alt="${product.name}">
              <h3>${product.name}</h3>
              <div>${product.price.toLocaleString('ru-RU')} ₽</div>
              <button class="add-to-cart-btn" data-product-id="${product.id}">В корзину</button>
          </div>
      `).join('');
  }
  ```

### `cart/index.html`

- **Описание**: Страница корзины.
- **Функции**:
  - Отображение товаров в корзине.
  - Изменение количества товаров.
  - Удаление товаров.
  - Расчёт итогов (товары, доставка, общая сумма).
  - Переход к оформлению заказа.

### `cart/script.js`

- **Описание**: Логика корзины.
- **Функции**:
  - Загрузка корзины из `localStorage`.
  - Обновление интерфейса при изменении корзины.
  - Расчёт стоимости доставки (вес × 100 ₽ + расстояние × 15 ₽, минимум 1000 ₽).
  - Сохранение данных заказа для оформления.
- **Код**:

  ```javascript
  function updateTotals() {
      const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const shipping = Math.max(baseShipping + distanceCost, 1000);
      const total = subtotal + shipping;
      localStorage.setItem('orderSummary', JSON.stringify({ items: cart, subtotal, shipping, total }));
  }
  ```

### `checkout/index.html`

- **Описание**: Страница оформления заказа.
- **Функции**:
  - Ввод данных доставки (ФИО, телефон, email, город, адрес).
  - Выбор способа оплаты (карта или наложенный платёж).
  - Генерация QR-кода для наложенного платежа.
  - Подтверждение заказа.

### `checkout/script.js`

- **Описание**: Логика оформления заказа.
- **Функции**:
  - Валидация формы (email, телефон, данные карты).
  - Обработка платежа (симуляция для карты, QR для наложенного платежа).
  - Сохранение заказа в `localStorage` и `orders.json`.
  - Очистка корзины после успешного заказа.
- **Код**:

  ```javascript
  async function handleFormSubmit(e) {
      e.preventDefault();
      if (!validateForm()) return;
      const order = createOrderObject();
      const paymentSuccess = await processPayment(order);
      if (paymentSuccess) {
          saveOrderToHistory(order);
          clearCheckoutData();
          window.location.href = '../order/order-history.html';
      }
  }
  ```

### `order/order-history.html`

- **Описание**: Страница истории заказов.
- **Функции**:
  - Отображение списка заказов.
  - Возможность отмены или удаления заказа.
  - Просмотр деталей заказа.

### `order/script.js`

- **Описание**: Логика истории заказов.
- **Функции**:
  - Загрузка заказов из `orders.json` и `localStorage`.
  - Отображение заказов с их статусом и деталями.
  - Обработка отмены и удаления заказов.
- **Код**:

  ```javascript
  function cancelOrder(orderId) {
      let orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const updatedOrders = orders.map(order => 
          order.orderNumber === orderId ? { ...order, status: 'Отменен' } : order
      );
      localStorage.setItem('orders', JSON.stringify(updatedOrders));
      window.location.reload();
  }
  ```

## Зависимости

- **Font Awesome 6.0.0**: Для иконок (корзина, выход и т.д.).
- **QR-код API**: Для генерации QR-кодов при наложенном платеже.

## Инструкции по использованию

1. Войдите как покупатель через `auth/index.html`.
2. Просмотрите каталог на `dashboard/buyer/index.html`.
3. Добавьте товары в корзину и перейдите в `cart/index.html`.
4. Оформите заказ в `checkout/index.html`.
5. Просмотрите историю заказов в `order/order-history.html`.

## Тестирование

- **Сценарии**:
  - Добавление/удаление товаров в корзине.
  - Оформление заказа с разными способами оплаты.
  - Отмена/удаление заказа.
  - Проверка расчёта доставки.
- **Проблемы**:
  - Ошибки при неверных путях к изображениям.
  - Ограниченная валидация ввода.

## Будущие улучшения
- Интеграция с сервером для хранения заказов.
