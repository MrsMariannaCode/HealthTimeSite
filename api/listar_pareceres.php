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

    $pdo->exec("CREATE TABLE IF NOT EXISTS pareceres (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        paciente_nome TEXT NOT NULL,
        medico_nome TEXT NOT NULL,
        texto TEXT NOT NULL,
        estado_evento TEXT DEFAULT 'SEM ALTERAÇÃO',
        data_hora DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    $colunas = $pdo->query("PRAGMA table_info(pareceres)")->fetchAll(PDO::FETCH_COLUMN, 1);
    if (!in_array('estado_evento', $colunas)) {
        $pdo->exec("ALTER TABLE pareceres ADD COLUMN estado_evento TEXT DEFAULT 'SEM ALTERAÇÃO'");
    }

    $tabelaAlertas = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='alertas'")->fetch();

    $stmt = $pdo->query("SELECT id, paciente_nome, medico_nome, texto, estado_evento, data_hora FROM pareceres ORDER BY id DESC");
    $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($resultados as &$row) {
        // Para registros antigos sem estado_evento salvo, busca o evento vigente até o horário da anotação
        if (empty($row['estado_evento'])) {
            $estadoHistorico = 'SEM ALTERAÇÃO';
            if ($tabelaAlertas && !empty($row['data_hora'])) {
                $stmtHist = $pdo->prepare("SELECT tipo_evento FROM alertas WHERE data_hora <= :dh ORDER BY id DESC LIMIT 1");
                $stmtHist->execute([':dh' => $row['data_hora']]);
                $ev = $stmtHist->fetch(PDO::FETCH_ASSOC);
                if ($ev && !empty($ev['tipo_evento'])) {
                    $estadoHistorico = trim($ev['tipo_evento']);
                }
            }
            $row['estado_evento'] = $estadoHistorico;
        }

        if (!empty($row['data_hora'])) {
            $row['data_hora'] = date('d/m/Y H:i', strtotime($row['data_hora']));
        }
    }

    echo json_encode($resultados, JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['erro' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}