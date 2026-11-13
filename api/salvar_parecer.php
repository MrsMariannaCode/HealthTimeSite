<?php
date_default_timezone_set('America/Sao_Paulo');
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);
    $texto = isset($input['texto']) ? trim($input['texto']) : (isset($_POST['texto']) ? trim($_POST['texto']) : '');

    if (empty($texto)) {
        http_response_code(400);
        echo json_encode(['erro' => 'O texto do parecer está vazio.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $dbPath = __DIR__ . '/../healthtime.db';
    $pdo = new PDO("sqlite:" . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $pdo->exec("CREATE TABLE IF NOT EXISTS pareceres (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        paciente_nome TEXT NOT NULL,
        medico_nome TEXT NOT NULL,
        texto TEXT NOT NULL,
        estado_evento TEXT DEFAULT 'SEM ALTERAÇÃO',
        data_hora DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // Coluna estado_evento 
    $colunas = $pdo->query("PRAGMA table_info(pareceres)")->fetchAll(PDO::FETCH_COLUMN, 1);
    if (!in_array('estado_evento', $colunas)) {
        $pdo->exec("ALTER TABLE pareceres ADD COLUMN estado_evento TEXT DEFAULT 'SEM ALTERAÇÃO'");
    }

    // Busca o evento mais recente do paciente no momento da anotação
    $estadoAtual = 'SEM ALTERAÇÃO';
    $tabelaAlertas = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='alertas'")->fetch();
    if ($tabelaAlertas) {
        $stmtEvento = $pdo->query("SELECT tipo_evento FROM alertas ORDER BY id DESC LIMIT 1");
        $ultimoEvento = $stmtEvento->fetch(PDO::FETCH_ASSOC);
        if ($ultimoEvento && !empty($ultimoEvento['tipo_evento'])) {
            $estadoAtual = trim($ultimoEvento['tipo_evento']);
        }
    }

    $dataHoraAtual = date('Y-m-d H:i:s');

    $stmt = $pdo->prepare("INSERT INTO pareceres (paciente_nome, medico_nome, texto, estado_evento, data_hora) VALUES (:paciente, :medico, :texto, :estado_evento, :data_hora)");
    $stmt->execute([
        ':paciente' => 'Marianna Batista',
        ':medico' => 'Dr. Carlos Eduardo',
        ':texto' => $texto,
        ':estado_evento' => $estadoAtual,
        ':data_hora' => $dataHoraAtual
    ]);

    echo json_encode([
        'status' => 'sucesso',
        'mensagem' => 'Parecer gravado no banco de dados do prontuário!',
        'estado_evento' => $estadoAtual
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['erro' => 'Falha no PHP/SQLite: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
}