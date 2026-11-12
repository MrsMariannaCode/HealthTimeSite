<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    $dbPath = __DIR__ . '/../healthtime.db';
    $pdo = new PDO("sqlite:" . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Garante que a tabela existe
    $pdo->exec("CREATE TABLE IF NOT EXISTS alertas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bpm INTEGER,
        spo2 INTEGER,
        tipo_evento TEXT,
        descricao TEXT,
        data_hora DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // Alterna aleatoriamente entre Taquicardia e Queda para deixar a demonstração realista
    $cenarios = [
        [
            'bpm' => 138,
            'spo2' => 91,
            'tipo_evento' => 'TAQUICARDIA',
            'descricao' => 'Frequência cardíaca crítica acima de 120 BPM em repouso!'
        ],
        [
            'bpm' => 115,
            'spo2' => 93,
            'tipo_evento' => 'QUEDA',
            'descricao' => 'Impacto brusco e imobilidade identificados pelo acelerômetro!'
        ]
    ];

    $cenarioSorteado = $cenarios[array_rand($cenarios)];

    $stmt = $pdo->prepare("INSERT INTO alertas (bpm, spo2, tipo_evento, descricao) VALUES (:bpm, :spo2, :tipo_evento, :descricao)");
    $stmt->execute([
        ':bpm' => $cenarioSorteado['bpm'],
        ':spo2' => $cenarioSorteado['spo2'],
        ':tipo_evento' => $cenarioSorteado['tipo_evento'],
        ':descricao' => $cenarioSorteado['descricao']
    ]);

    echo json_encode([
        'status' => 'sucesso',
        'mensagem' => 'Alerta crítico gravado no banco de dados da UBS!',
        'evento' => $cenarioSorteado
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'erro' => 'Erro ao simular alerta no banco de dados',
        'detalhes' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}