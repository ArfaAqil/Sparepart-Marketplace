<?php
namespace App\Helpers;

class Response
{
    /**
     * Отправляет JSON и завершает скрипт
     *
     * @param mixed $data   Данные для кодирования в JSON
     * @param int   $status HTTP статус ответа
     */
    public static function json($data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }
}