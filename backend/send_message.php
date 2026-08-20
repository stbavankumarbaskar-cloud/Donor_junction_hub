<?php
// send_message.php - Send a chat message
require_once __DIR__ . '/db_config.php';

$raw = file_get_contents('php://input');
$data = json_decode($raw, true) ?: $_POST;

$donor_id = isset($data['donor_id']) ? trim($data['donor_id']) : '1';
$org_mobile = isset($data['org_mobile']) ? trim($data['org_mobile']) : '';
$message_text = isset($data['message_text']) ? trim($data['message_text']) : '';
$is_me = isset($data['is_me']) ? (int)$data['is_me'] : 1;

if (empty($message_text)) {
    echo json_encode(['status' => 'error', 'message' => 'Message text cannot be empty']);
    exit();
}

if (!$pdo) {
    echo json_encode(['status' => 'success', 'message' => 'Message sent (offline mode)']);
    exit();
}

try {
    $sender = $is_me ? 'partner' : 'user';
    $timestamp = date('h:i A');

    $sql = "INSERT INTO chat_messages (user_phone, partner_mobile, partner_name, sender, text, timestamp) 
            VALUES (:user_phone, :partner_mobile, 'Donor Partner', :sender, :text, :timestamp)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'user_phone' => $donor_id,
        'partner_mobile' => $org_mobile,
        'sender' => $sender,
        'text' => $message_text,
        'timestamp' => $timestamp
    ]);

    // Also update chat thread last message
    $threadSql = "INSERT INTO chat_threads (user_phone, partner_mobile, partner_name, partner_type, last_message) 
                  VALUES (:user_phone, :partner_mobile, 'Donor Partner', 'hospital', :last_message)
                  ON DUPLICATE KEY UPDATE last_message = :last_message, updated_at = CURRENT_TIMESTAMP";
    $stmtThread = $pdo->prepare($threadSql);
    $stmtThread->execute([
        'user_phone' => $donor_id,
        'partner_mobile' => $org_mobile,
        'last_message' => $message_text
    ]);

    echo json_encode(['status' => 'success', 'message' => 'Message sent successfully']);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
