<?php
namespace Tests;
use Tests\BaseTest;

class AuthTest extends BaseTest
{
    public function testRegisterAndLogin(): string
    {
        // Регистрация
        $res = self::$client->post('register', [
            'json' => [
                'name'     => 'Test User',
                'email'    => 'test@example.com',
                'password' => 'secret123'
            ]
        ]);
        $this->assertEquals(200, $res->getStatusCode());
        $data = $this->parseResponse($res);
        $this->assertTrue($data['success']);

        // Логин
        $res2 = self::$client->post('login', [
            'json' => [
                'email'    => 'test@example.com',
                'password' => 'secret123'
            ]
        ]);
        $this->assertEquals(200, $res2->getStatusCode());
        $data2 = $this->parseResponse($res2);
        $this->assertTrue($data2['success']);
        $this->assertArrayHasKey('token', $data2['data']);

        return $data2['data']['token'];
    }
}
