<?php
namespace Tests;
use Tests\BaseTest;

class OrderTest extends BaseTest
{
    /** @depends Tests\PartsTest::testCrudParts */
    public function testCreateOrder(string $token): void
    {
        $headers = ['Authorization' => "Bearer {$token}"];

        // Создание заказа (предполагается, что part_id = 1 существует)
        $res = self::$client->post('orders', [
            'headers' => $headers,
            'json'    => [
                'user_id' => 1,
                'items'   => [['part_id' => 1, 'qty' => 2]]
            ]
        ]);
        $this->assertEquals(201, $res->getStatusCode());
        $data = $this->parseResponse($res);
        $this->assertTrue($data['success']);
        $this->assertArrayHasKey('id', $data['data']);
    }
}
