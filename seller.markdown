# Документация: Модуль продавца (`dashboard/seller`)

## Обзор

Модуль `dashboard/seller` предназначен для пользователей с ролью «продавец». Он позволяет управлять товарами (добавление, редактирование, удаление) и просматривать заказы. Модуль интегрирован с данными из `products.json` и `orders.json`.

## Структура

```
dashboard/seller/
├── order/
│   ├── index.html    # Страница заказов
│   ├── style.css     # Стили для заказов
│   └── script.js     # Логика заказов
├── index.html        # Главная страница продавца
├── style.css         # Стили для продавца
└── script.js         # Логика управления товарами
```

### `index.html`
- **Описание**: Главная страница продавца.
- **Функции**:
  - Отображение списка товаров продавца.
  - Кнопка для добавления нового товара.
  - Ссылка на просмотр заказов.
- **Элементы**:
  - `.product-grid`: Сетка товаров.
  - `#addProductBtn`: Кнопка добавления товара.

### `script.js`
- **Описание**: Логика управления товарами.
- **Функции**:
  - Загрузка товаров из `products.json` и `localStorage`.
  - Отображение товаров в виде карточек.
  - Модальное окно для добавления/редактирования товаров.
  - Удаление товаров.
- **Код**:
  ```javascript
  document.getElementById('productForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const newProduct = {
          id: e.target.dataset.productId || Date.now().toString(),
          name: document.getElementById('productName').value,
          price: parseFloat(document.getElementById('productPrice').value),
          ...
      };
      let localProducts = JSON.parse(localStorage.getItem('products') || '[]');
      localProducts.push(newProduct);
      localStorage.setItem('products', JSON.stringify(localProducts));
      renderProducts([...products, ...localProducts]);
  });
  ```

### `order/index.html`
- **Описание**: Страница просмотра заказов продавца.
- **Функции**:
  - Отображение списка заказов.
  - Просмотр деталей заказа.
  - Экспорт заказов в Excel (не реализован).

### `order/script.js`
- **Описание**: Логика управления заказами.
- **Функции**:
  - Загрузка заказов из `orders.json` и `localStorage`.
  - Отображение заказов с возможностью обработки.
- **Примечание**: Функционал ограничен, экспорт в Excel не реализован.

## Зависимости

- **Font Awesome 6.0.0**: Для иконок.
- **Данные**: Зависит от `dashboard/buyer/data/products.json` и `orders.json`.

## Инструкции по использованию

1. Войдите как продавец через `auth/index.html`.
2. На `dashboard/seller/index.html` добавьте или отредактируйте товары.
3. Перейдите в `order/index.html` для просмотра заказов.

## Тестирование

- **Сценарии**:
  - Добавление/редактирование/удаление товара.
  - Проверка корректного отображения заказов.
- **Проблемы**:
  - Отсутствие фильтрации товаров по продавцу.
  - Нереализованный экспорт в Excel.

## Будущие улучшения

- Фильтрация товаров по продавцу.
- Реализация экспорта заказов в Excel.
- Интеграция с сервером для синхронизации данных.