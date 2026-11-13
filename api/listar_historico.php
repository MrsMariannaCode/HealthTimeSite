<?php
date_default_timezone_set('America/Sao_Paulo');
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    $dbPath = __DIR__ . '/../healthtime.db';
    if (!file_exists($dbPath)) {
        echo json_encode([]);
        exit;
    }

    $pdo = new PDO("sqlite:" . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $pdo->query("SELECT id, bpm, spo2, tipo_evento, descricao, data_hora FROM alertas ORDER BY id DESC LIMIT 20");
    $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($resultados as &$row) {
        if (!empty($row['data_hora'])) {
            $row['data_hora'] = date('d/m/Y H:i', strtotime($row['data_hora']));
        }
    }

    echo json_encode($resultados, JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['erro' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}