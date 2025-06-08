<?php
namespace App\Controller;

class OrderController
{
    private $db;
    public function __construct($db)
    {
        $this->db = $db;
    }

    // Создать заказ
    public function createOrder()
    {
        $data = $this->getJsonInput();
        $this->validateOrderData($data);

        $stmt = $this->db->prepare("INSERT INTO orders (user_id, seller_id, order_number, items, subtotal, shipping, total, city, status, date, payment_method, customer, payment_amount, delivery_date)
            VALUES (:user_id, :seller_id, :order_number, :items, :subtotal, :shipping, :total, :city, :status, :date, :payment_method, :customer, :payment_amount, :delivery_date)");
        $date = $data['date'] ?? date('Y-m-d H:i:s');

        // Преобразуем ISO 8601 в формат MySQL, если нужно
        if (strpos($date, 'T') !== false) {
            $dt = new \DateTime($date);
            $date = $dt->format('Y-m-d H:i:s');
        }

        $stmt->execute([
            'user_id'        => $data['userId'] ?? null,
            'seller_id'      => $data['sellerId'] ?? null,
            'order_number'   => $data['orderNumber'] ?? uniqid('ORD-'),
            'items'          => json_encode($data['items'] ?? []),
            'subtotal'       => $data['subtotal'] ?? 0,
            'shipping'       => $data['shipping'] ?? 0,
            'total'          => $data['total'] ?? 0,
            'city'           => $data['city'] ?? '',
            'status'         => $data['status'] ?? 'Ожидает оплаты',
            'date'           => $date,
            'payment_method' => $data['paymentMethod'] ?? 'card',
            'customer'       => json_encode($data['customer'] ?? []),
            'payment_amount' => $data['paymentAmount'] ?? 0,
            'delivery_date'  => $data['customer']['deliveryDate'] ?? null,
        ]);
        echo json_encode(['success' => true]);
    }

    // Получить заказы пользователя
    public function getOrders()
    {
        $userId = $_GET['userId'] ?? null;
        if (!$userId) {
            http_response_code(400);
            echo json_encode([]);
            return;
        }
        $stmt = $this->db->prepare("SELECT * FROM orders WHERE user_id = :user_id ORDER BY date DESC");
        $stmt->execute(['user_id' => $userId]);
        $orders = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        foreach ($orders as &$order) {
            $order['items'] = json_decode($order['items'], true);
            $order['customer'] = json_decode($order['customer'], true);
        }
        echo json_encode($orders);
    }

    // Получить заказы продавца
    public function getSellerOrders()
    {
        $sellerId = $_GET['sellerId'] ?? null;
        if (!$sellerId) {
            http_response_code(400);
            echo json_encode([]);
            return;
        }
        $stmt = $this->db->prepare("SELECT * FROM orders WHERE seller_id = :seller_id ORDER BY date DESC");
        $stmt->execute(['seller_id' => $sellerId]);
        $orders = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        foreach ($orders as &$order) {
            $order['items'] = json_decode($order['items'], true);
            $order['customer'] = json_decode($order['customer'], true);
        }
        echo json_encode($orders);
    }

    // Отмена заказа
    public function cancelOrder()
    {
        $data = $this->getJsonInput();
        $orderNumber = $data['orderNumber'] ?? null;
        $userId = $data['userId'] ?? null;
        if (!$orderNumber || !$userId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Нет данных']);
            return;
        }
        $stmt = $this->db->prepare("UPDATE orders SET status = 'Отменен' WHERE order_number = :order_number AND user_id = :user_id");
        $stmt->execute(['order_number' => $orderNumber, 'user_id' => $userId]);
        echo json_encode(['success' => true]);
    }

    // Удаление заказа
    public function deleteOrder($orderNumber)
    {
        $data = $this->getJsonInput();
        $userId = $data['userId'] ?? null;
        if (!$orderNumber || !$userId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Нет данных']);
            return;
        }
        $stmt = $this->db->prepare("DELETE FROM orders WHERE order_number = :order_number AND user_id = :user_id");
        $stmt->execute(['order_number' => $orderNumber, 'user_id' => $userId]);
        echo json_encode(['success' => true]);
    }

    // Обновление статуса заказа
    public function updateOrder($orderNumber)
    {
        $data = $this->getJsonInput();
        $userId = $data['userId'] ?? null;
        $status = $data['status'] ?? null;
        if (!$orderNumber || !$userId || !$status) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Нет данных']);
            return;
        }
        $stmt = $this->db->prepare("UPDATE orders SET status = :status WHERE order_number = :order_number AND user_id = :user_id");
        $stmt->execute(['status' => $status, 'order_number' => $orderNumber, 'user_id' => $userId]);
        echo json_encode(['success' => true]);
    }

    private function validateOrderData($data)
    {
        if (
            empty($data['userId']) ||
            empty($data['items']) || !is_array($data['items']) ||
            !isset($data['subtotal']) ||
            !isset($data['shipping']) ||
            !isset($data['total']) ||
            empty($data['city']) ||
            empty($data['customer']) || !is_array($data['customer'])
        ) {
            \App\Helpers\Response::json(['success' => false, 'message' => 'Некорректные данные заказа'], 400);
        }
        // Можно добавить дополнительные проверки (например, на email, телефон и т.д.)
    }

    private function getJsonInput(): array
    {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!is_array($input)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Некорректный JSON']);
            exit;
        }
        return $input;
    }
}