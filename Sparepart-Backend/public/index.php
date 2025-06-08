<?php
// Автозагрузка классов
require __DIR__ . '/../vendor/autoload.php';

// Загрузка настроек подключения к базе данных
$config = require __DIR__ . '/../config/config.php';

// CORS-заголовки
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Создание подключения к базе данных (PDO)
$dsn = sprintf(
    'mysql:host=%s;dbname=%s;charset=%s',
    $config['db']['host'],
    $config['db']['dbname'],
    $config['db']['charset']
);
$db = new PDO($dsn, $config['db']['user'], $config['db']['pass'], [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
]);

use App\Controller\AuthController;
use App\Controller\OrderController;

$auth = new AuthController($db);
$order = new OrderController($db);

// Маршрутизация
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

if ($uri === '/register' && $method === 'POST') {
    $auth->register();
} elseif ($uri === '/login' && $method === 'POST') {
    $auth->login();
} elseif ($uri === '/logout' && $method === 'POST') {
    $auth->logout();
} elseif ($uri === '/orders' && $method === 'POST') {
    $order->createOrder();
} elseif ($uri === '/orders' && $method === 'GET') {
    $order->getOrders();
} elseif ($uri === '/seller/orders' && $method === 'GET') {
    $order->getSellerOrders();
} elseif (preg_match('#^/orders/([^/]+)$#', $uri, $matches) && $method === 'PATCH') {
    $order->updateOrder($matches[1]);
} elseif (preg_match('#^/orders/([^/]+)$#', $uri, $matches) && $method === 'DELETE') {
    $order->deleteOrder($matches[1]);
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Not Found']);
}
