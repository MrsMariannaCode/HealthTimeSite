<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    // Conexão com o banco de dados SQLite local
    $dbPath = __DIR__ . '/../healthtime.db';
    $pdo = new PDO("sqlite:" . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Garante a existência da tabela de alertas
    $pdo->exec("CREATE TABLE IF NOT EXISTS alertas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bpm INTEGER,
        spo2 INTEGER,
        tipo_evento TEXT,
        descricao TEXT,
        data_hora DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // Busca os eventos formatando a data para o padrão brasileiro
    $query = "SELECT id, bpm, spo2, tipo_evento, descricao, 
                     strftime('%d/%m/%Y %H:%M', data_hora, 'localtime') as data_hora 
              FROM alertas 
              ORDER BY id DESC";
              
    $stmt = $pdo->query($query);
    $historico = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($historico, JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'erro' => 'Falha ao conectar com o banco de dados',
        'detalhes' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}