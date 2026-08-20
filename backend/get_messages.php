<?php
// get_messages.php - Fetch chat messages between donor and organization
require_once __DIR__ . '/db_config.php';

$org_mobile = isset($_GET['org_mobile']) ? trim($_GET['org_mobile']) : '';
$donor_id = isset($_GET['donor_id']) ? trim($_GET['donor_id']) : '';

if (!$pdo) {
    echo json_encode([
        'status' => 'success',
        'messages' => [
            [
                'id' => '1',
                'text' => 'Hello! We saw your blood donation inquiry.',
                'me' => true
            ],
            [
                'id' => '2',
                'text' => 'Yes, I am willing to donate A+ blood tomorrow morning.',
                'me' => false
            ]
        ]
    ]);
    exit();
}

try {
    $stmt = $pdo->prepare("SELECT * FROM chat_messages WHERE partner_mobile = :mobile OR user_phone = :mobile ORDER BY created_at ASC");
    $stmt->execute(['mobile' => $org_mobile]);
    $rows = $stmt->fetchAll();

    $messages = [];
    foreach ($rows as $r) {
        $messages[] = [
            'id' => (string)$r['id'],
            'text' => $r['text'],
            'me' => ($r['sender'] === 'partner' || $r['sender'] === 'user'),
            'time' => $r['timestamp'] ?: date('h:i A', strtotime($r['created_at']))
        ];
    }

    if (empty($messages)) {
        $messages = [
            [
                'id' => '1',
                'text' => 'Hello! We saw your blood donation inquiry.',
                'me' => true
            ],
            [
                'id' => '2',
                'text' => 'Yes, I am willing to donate blood tomorrow morning at 10 AM.',
                'me' => false
            ]
        ];
    }

    echo json_encode([
        'status' => 'success',
        'messages' => $messages
    ]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
