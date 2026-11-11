<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido. Utilize POST.'], JSON_UNESCAPED_UNICODE);
    exit;
}

// Aceita requisições via JSON ou Formulário padrão (x-www-form-urlencoded)
$input = json_decode(file_get_contents('php://input'), true);
$texto = isset($input['texto']) ? trim($input['texto']) : (isset($_POST['texto']) ? trim($_POST['texto']) : '');

if (empty($texto)) {
    http_response_code(400);
    echo json_encode(['erro' => 'O texto do parecer não pode estar vazio.'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    // Conexão com o banco de dados SQLite
    $dbPath = __DIR__ . '/../healthtime.db';
    $pdo = new PDO("sqlite:" . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Cria a tabela de pareceres do prontuário caso não exista
    $pdo->exec("CREATE TABLE IF NOT EXISTS pareceres (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        texto TEXT NOT NULL,
        data_hora DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // Insere as observações médicas
    $stmt = $pdo->prepare("INSERT INTO pareceres (texto) VALUES (:texto)");
    $stmt->execute([':texto' => $texto]);

    echo json_encode([
        'status' => 'sucesso',
        'mensagem' => 'Parecer salvo com sucesso no prontuário!',
        'id' => $pdo->lastInsertId()
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'erro' => 'Erro ao salvar parecer no banco de dados',
        'detalhes' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}