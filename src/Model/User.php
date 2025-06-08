<?php
namespace App\Model;

use PDO;
use PDOException;

class User
{
    private PDO $db;

    /**
     * Инициализирует модель с PDO-подключением
     *
     * @param PDO $db Подключение к БД
     */
    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * Находит пользователя по email
     *
     * @param string $email
     * @return array|null Возвращает массив с полями или null, если не найден
     */
    public function findByEmail(string $email): ?array
    {
        $sql = 'SELECT id, email, password_hash, created_at, role FROM users WHERE email = :email LIMIT 1';
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':email', $email, PDO::PARAM_STR);

        if (!$stmt->execute()) {
            return null;
        }

        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        return $user ?: null;
    }

    /**
     * Создает нового пользователя
     *
     * @param string $email       Email (уникальный)
     * @param string $passwordHash Вычисленный хеш пароля
     * @return int ID созданного пользователя
     * @throws PDOException при ошибке вставки
     */
    public function create(string $email, string $passwordHash, string $role = 'buyer'): int
    {
        $sql = 'INSERT INTO users (email, password_hash, created_at, role) VALUES (:email, :password_hash, NOW(), :role)';
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':email', $email, PDO::PARAM_STR);
        $stmt->bindParam(':password_hash', $passwordHash, PDO::PARAM_STR);
        $stmt->bindParam(':role', $role, PDO::PARAM_STR);

        if (!$stmt->execute()) {
            $error = $stmt->errorInfo()[2] ?? 'Unknown error';
            throw new PDOException("DB insert error: {$error}");
        }

        return (int)$this->db->lastInsertId();
    }
}