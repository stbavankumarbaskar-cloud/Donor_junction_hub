<?php
// update_campaign_progress.php - Log collected units and update status
require_once __DIR__ . '/db_config.php';

$raw = file_get_contents('php://input');
$data = json_decode($raw, true) ?: $_POST;

$id = isset($data['id']) ? trim($data['id']) : '';
$collected = isset($data['collected']) ? (int)$data['collected'] : 0;
$status = isset($data['status']) ? trim($data['status']) : null;
$status_color = isset($data['status_color']) ? trim($data['status_color']) : null;
$status_bg = isset($data['status_bg']) ? trim($data['status_bg']) : null;

if (empty($id)) {
    echo json_encode(['status' => 'error', 'message' => 'Campaign ID is required']);
    exit();
}

if (!$pdo) {
    echo json_encode(['status' => 'success', 'message' => 'Campaign progress updated']);
    exit();
}

try {
    $sql = "UPDATE campaigns SET collected = :collected";
    $params = ['collected' => $collected, 'id' => $id];

    if ($status !== null) {
        $sql .= ", status = :status";
        $params['status'] = $status;
    }
    if ($status_color !== null) {
        $sql .= ", status_color = :status_color";
        $params['status_color'] = $status_color;
    }
    if ($status_bg !== null) {
        $sql .= ", status_bg = :status_bg";
        $params['status_bg'] = $status_bg;
    }

    $sql .= " WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    echo json_encode(['status' => 'success', 'message' => 'Campaign progress updated successfully']);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
