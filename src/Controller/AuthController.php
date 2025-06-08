<?php
namespace App\Controller;

use App\Model\User;
use App\Helpers\Response;
use PDO;

class AuthController
{
    private PDO $db;
    private User $userModel;

    public function __construct(PDO $db)
    {
        $this->db = $db;
        $this->userModel = new User($db);
    }

    //Регистрация нового пользователя
    public function register(): void
    {
        $input = $this->getJsonInput();
        $this->validateUserData($input);

        if ($this->userModel->findByEmail($input['email'])) {
            Response::json(['error' => 'User already exists'], 409);
        }

        $passwordHash = password_hash($input['password'], PASSWORD_DEFAULT);
        try {
            $userId = $this->userModel->create(
                $input['email'],
                $passwordHash,
                $input['role'] ?? 'buyer'
            );
        } catch (\PDOException $e) {
            Response::json(['error' => 'Registration failed'], 500);
        }

        Response::json(['message' => 'User registered', 'user_id' => $userId], 201);
    }

    //Вход пользователя
    public function login(): void
    {
        $input = $this->getJsonInput();
        $this->validateUserData($input);

        $user = $this->userModel->findByEmail($input['email']);
        if (!$user || !password_verify($input['password'], $user['password_hash'])) {
            Response::json(['error' => 'Invalid credentials'], 401);
        }

        session_start();
        $_SESSION['user_id'] = $user['id'];

        Response::json([
            'success' => true,
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'role' => $user['role'] ?? 'buyer',
                'username' => $user['username'] ?? $user['email'],
            ]
        ], 200);
    }

    //Выход пользователя
    public function logout(): void
    {
        session_start();
        session_unset();
        session_destroy();

        Response::json(['message' => 'Logged out'], 200);
    }

    private function validateUserData($input)
    {
        if (empty($input['email']) || empty($input['password'])) {
            Response::json(['error' => 'Email и пароль обязательны'], 400);
        }
        if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
            Response::json(['error' => 'Некорректный email'], 400);
        }
        if (strlen($input['password']) < 6) {
            Response::json(['error' => 'Пароль должен быть не менее 6 символов'], 400);
        }
    }

    private function getJsonInput(): array
    {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!is_array($input)) {
            Response::json(['error' => 'Некорректный JSON'], 400);
        }
        return $input;
    }
}
