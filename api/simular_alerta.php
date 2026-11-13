<?php
date_default_timezone_set('America/Sao_Paulo');
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    $dbPath = __DIR__ . '/../healthtime.db';
    $pdo = new PDO("sqlite:" . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $pdo->exec("CREATE TABLE IF NOT EXISTS alertas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bpm INTEGER,
        spo2 INTEGER,
        tipo_evento TEXT,
        descricao TEXT,
        data_hora DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // Consulta o último evento gravado para intercalar os 3 cenários
    $stmtUltimo = $pdo->query("SELECT tipo_evento FROM alertas ORDER BY id DESC LIMIT 1");
    $ultimo = $stmtUltimo->fetch(PDO::FETCH_ASSOC);
    $tipoAnterior = $ultimo ? trim($ultimo['tipo_evento']) : '';

    if ($tipoAnterior === 'TAQUICARDIA') {
        $evento = [
            'bpm' => 115,
            'spo2' => 93,
            'tipo_evento' => 'QUEDA',
            'descricao' => 'Impacto brusco e imobilidade identificados pelo acelerômetro!'
        ];
    } elseif ($tipoAnterior === 'QUEDA') {
        $evento = [
            'bpm' => 74,
            'spo2' => 98,
            'tipo_evento' => 'SEM ALTERAÇÃO',
            'descricao' => 'Monitoramento de rotina: sinais vitais estáveis e dentro da normalidade.'
        ];
    } else {
        $evento = [
            'bpm' => 142,
            'spo2' => 90,
            'tipo_evento' => 'TAQUICARDIA',
            'descricao' => 'Frequência cardíaca crítica acima de 120 BPM em repouso!'
        ];
    }

    $dataHoraAtual = date('Y-m-d H:i:s');

    $stmt = $pdo->prepare("INSERT INTO alertas (bpm, spo2, tipo_evento, descricao, data_hora) VALUES (:bpm, :spo2, :tipo_evento, :descricao, :data_hora)");
    $stmt->execute([
        ':bpm' => $evento['bpm'],
        ':spo2' => $evento['spo2'],
        ':tipo_evento' => $evento['tipo_evento'],
        ':descricao' => $evento['descricao'],
        ':data_hora' => $dataHoraAtual
    ]);

    echo json_encode([
        'status' => 'sucesso',
        'mensagem' => 'Registro de monitoramento gravado com sucesso!',
        'evento' => $evento,
        'data_hora' => $dataHoraAtual
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['erro' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}