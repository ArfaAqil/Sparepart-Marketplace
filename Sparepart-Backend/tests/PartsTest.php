<?php
namespace Tests;
use Tests\BaseTest;

class PartsTest extends BaseTest
{
    /** @depends Tests\AuthTest::testRegisterAndLogin */
    public function testCrudParts(string $token): string
    {
        $headers = ['Authorization' => "Bearer {$token}"];

        // Создание запчасти
        $resCreate = self::$client->post('parts', [
            'headers' => $headers,
            'json'    => [
                'name'        => 'Brake Pad',
                'description' => 'High-quality brake pad',
                'price'       => 49.99,
                'stock_qty'   => 100
            ]
        ]);
        $this->assertEquals(201, $resCreate->getStatusCode());
        $createData = $this->parseResponse($resCreate);
        $this->assertTrue($createData['success']);
        $partId = $createData['data']['id'];

        // Получение списка
        $resList = self::$client->get('parts', [
            'headers' => $headers,
            'query'   => ['page'=>1,'limit'=>10]
        ]);
        $this->assertEquals(200, $resList->getStatusCode());
        $listData = $this->parseResponse($resList);
        $this->assertTrue($listData['success']);
        $this->assertNotEmpty($listData['data']);

        // Обновление
        $resUpdate = self::$client->put("parts/{$partId}", [
            'headers' => $headers,
            'json'    => ['price' => 44.99]
        ]);
        $this->assertEquals(200, $resUpdate->getStatusCode());
        $updateData = $this->parseResponse($resUpdate);
        $this->assertTrue($updateData['success']);
        $this->assertEquals(44.99, $updateData['data']['price']);

        // Удаление
        $resDelete = self::$client->delete("parts/{$partId}", [
            'headers' => $headers
        ]);
        $this->assertEquals(200, $resDelete->getStatusCode());
        $delData = $this->parseResponse($resDelete);
        $this->assertTrue($delData['success']);

        return $token;
    }
}
