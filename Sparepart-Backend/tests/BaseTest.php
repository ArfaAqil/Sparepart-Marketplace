<?php
namespace Tests;

use GuzzleHttp\Client;
use PHPUnit\Framework\TestCase;

class BaseTest extends TestCase
{
    protected static $client;

    public static function setUpBeforeClass(): void
    {
        self::$client = new Client([
            'base_uri' => 'http://localhost:8000/api/',
            'http_errors' => false,
        ]);
    }

    protected function parseResponse($response)
    {
        return json_decode($response->getBody()->getContents(), true);
    }
}