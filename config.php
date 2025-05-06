<?php
$host = 'localhost';
$dbname = 'autoparts';
$user = 'root'; // Логин по умолчанию в XAMPP
$pass = ''; // Пароль по умолчанию пустой

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Ошибка подключения: " . $e->getMessage());
}
?>
