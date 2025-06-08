# Документация Sparepart-Backend (ветка Vadim)

## Оглавление

1. [Обзор](#обзор)
2. [Архитектура и технологии](#архитектура-и-технологии)
3. [Установка и настройка](#установка-и-настройка)

   * [Клонирование репозитория](#клонирование-репозитория)
   * [Установка зависимостей](#установка-зависимостей)
   * [Настройка переменных окружения](#настройка-переменных-окружения)
   * [Настройка базы данных](#настройка-базы-данных)
   * [Запуск приложения](#запуск-приложения)
4. [Структура проекта](#структура-проекта)
5. [Конфигурация](#конфигурация)
6. [API Reference](#api-reference)

   * [Аутентификация](#аутентификация)
   * [Работа с запчастями](#работа-с-запчастями)
   * [Управление заказами](#управление-заказами)
7. [Модели данных](#модели-данных)
8. [Обработка ошибок](#обработка-ошибок)
9. [Логирование и мониторинг](#логирование-и-мониторинг)

---

## Обзор

Сервис **Sparepart-Backend** реализован на PHP и обеспечивает серверную часть маркетплейса запчастей. Основные функции:

* Регистрация и аутентификация пользователей
* Управление каталогом запчастей (CRUD)
* Создание и отслеживание заказов
* Возврат JSON-ответов со статусами и данными

## Архитектура и технологии

* **Язык:** PHP 7.4+
* **Менеджер зависимостей:** Composer
* **База данных:** MySQL
* **Роутинг и контроллеры:** собственная реализация в `public/index.php` и `src/Controller`
* **Организация кода:** MVC-подобная структура без фреймворка
* **Аутентификация:** JWT (проверка токена в заголовке Authorization)

## Установка и настройка

### Клонирование репозитория

```bash
git clone https://github.com/ArfaAqil/Sparepart-Marketplace.git
cd Sparepart-Marketplace/Sparepart-Backend
git checkout Vadim
```

### Установка зависимостей

```bash
composer install
```

### Настройка переменных окружения

Скопируйте шаблон и отредактируйте `config/config.php`:

```php
return [
    'db' => [
        'host' => 'localhost',
        'port' => 3306,
        'name' => 'spareparts',
        'user' => 'ваш_пользователь',
        'pass' => 'ваш_пароль'
    ],
    'jwt_secret' => 'ваш_секретный_ключ',
    'jwt_expire' => 86400 // время жизни токена в секундах
];
```

### Настройка базы данных

1. Убедитесь, что MySQL запущен.
2. Создайте базу данных:

   ```sql
   CREATE DATABASE spareparts CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Создайте таблицы (пример SQL):

   ```sql
   CREATE TABLE users (
     id INT AUTO_INCREMENT PRIMARY KEY,
     name VARCHAR(100) NOT NULL,
     email VARCHAR(255) NOT NULL UNIQUE,
     password VARCHAR(255) NOT NULL,
     role VARCHAR(50) DEFAULT 'user'
   );

   CREATE TABLE spare_parts (
     id INT AUTO_INCREMENT PRIMARY KEY,
     name VARCHAR(150) NOT NULL,
     description TEXT,
     price DECIMAL(10,2) NOT NULL,
     stock_qty INT DEFAULT 0
   );

   CREATE TABLE orders (
     id INT AUTO_INCREMENT PRIMARY KEY,
     user_id INT NOT NULL,
     total_price DECIMAL(10,2) NOT NULL,
     status VARCHAR(50) DEFAULT 'pending',
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (user_id) REFERENCES users(id)
   );

   CREATE TABLE order_items (
     id INT AUTO_INCREMENT PRIMARY KEY,
     order_id INT NOT NULL,
     part_id INT NOT NULL,
     qty INT NOT NULL,
     FOREIGN KEY (order_id) REFERENCES orders(id),
     FOREIGN KEY (part_id) REFERENCES spare_parts(id)
   );
   ```

### Запуск приложения

Скопируйте или настройте виртуальный хост, чтобы корнем сайта была папка `public/`. Например, для PHP встроенного сервера:

```bash
php -S localhost:8000 -t public
```

Перейдите в браузере на `http://localhost:8000`.

## Структура проекта

```
SPAREPART-BACKEND/
├── config/
│   └── config.php         # Конфигурация БД, JWT
├── public/
│   ├── .htaccess          # Перенаправление запросов
│   └── index.php          # Точка входа (роутинг)
├── src/
│   ├── Controller/        # Контроллеры API
│   │   ├── AuthController.php
│   │   └── OrderController.php
│   ├── Helpers/           # Утилиты для формата ответа
│   │   └── Response.php
│   └── Model/             # Модели данных
│       └── User.php
├── vendor/                # Зависимости Composer
├── composer.json
└── LICENSE
```

## Конфигурация

* **config/config.php** — параметры подключения к БД и JWT
* **public/index.php** — маршрутизация запросов и вызов контроллеров

## API Reference

Все эндпоинты возвращают и принимают JSON. Префикс: `/api`.

### Аутентификация

| Эндпоинт        | Метод | Описание                 | Тело запроса                    |
| --------------- | ----- | ------------------------ | ------------------------------- |
| `/api/register` | POST  | Регистрация пользователя | `{ name, email, password }`     |
| `/api/login`    | POST  | Логин и получение JWT    | `{ email, password }`           |
| `/api/logout`   | POST  | Инвалидация токена       | (JWT в заголовке Authorization) |

### Работа с запчастями

| Эндпоинт          | Метод  | Описание                                    | Тело запроса / параметры                  |
| ----------------- | ------ | ------------------------------------------- | ----------------------------------------- |
| `/api/parts`      | GET    | Список запчастей с пагинацией и фильтрацией | `page`, `limit`, `search` (query)         |
| `/api/parts/{id}` | GET    | Информация о запчасти                       | `{id}` (URL)                              |
| `/api/parts`      | POST   | Создание новой запчасти                     | `{ name, price, description, stock_qty }` |
| `/api/parts/{id}` | PUT    | Обновление запчасти                         | `{}` (JSON body)                          |
| `/api/parts/{id}` | DELETE | Удаление запчасти                           | `{id}` (URL)                              |

### Управление заказами

| Эндпоинт                  | Метод | Описание               | Тело запроса                             |
| ------------------------- | ----- | ---------------------- | ---------------------------------------- |
| `/api/orders`             | POST  | Создать заказ          | `{ user_id, items: [{ part_id, qty }] }` |
| `/api/orders/{id}`        | GET   | Получить детали заказа | `{id}` (URL)                             |
| `/api/orders/{id}/status` | PATCH | Обновить статус заказа | `{ status }`                             |

## Модели данных

* **User**: `id`, `name`, `email`, `password`, `role`
* **SparePart**: `id`, `name`, `description`, `price`, `stock_qty`
* **Order**: `id`, `user_id`, `total_price`, `status`, `created_at`
* **OrderItem**: `id`, `order_id`, `part_id`, `qty`

## Обработка ошибок

Все ошибки возвращаются в формате:

```json
{
  "success": false,
  "message": "Описание ошибки",
  "data": null
}
```

При успешных запросах:

```json
{
  "success": true,
  "message": "Успешно",
  "data": { ... }
}
```

## Логирование и мониторинг

* Логи запросов при необходимости можно добавить через middleware в `public/index.php`
* Рекомендовано интегрировать сторонние сервисы (Prometheus, ELK) при росте нагрузки
