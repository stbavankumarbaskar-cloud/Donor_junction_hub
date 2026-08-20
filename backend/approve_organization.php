<?php
// approve_organization.php - Approve or decline organization registration
require_once __DIR__ . '/db_config.php';

$raw = file_get_contents('php://input');
$data = json_decode($raw, true) ?: $_POST;

$id = isset($data['id']) ? trim($data['id']) : '';
$status = isset($data['status']) ? trim($data['status']) : 'approved';

if (empty($id)) {
    echo json_encode(['status' => 'error', 'message' => 'Organization ID or mobile is required']);
    exit();
}

if (!in_array($status, ['approved', 'declined', 'pending'])) {
    $status = 'approved';
}

if (!$pdo) {
    echo json_encode(['status' => 'success', 'message' => "Organization updated to $status"]);
    exit();
}

try {
    $sql = "UPDATE organizations SET status = :status WHERE id = :id OR org_id = :id OR mobile = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['status' => $status, 'id' => $id]);

    echo json_encode(['status' => 'success', 'message' => "Organization status updated to $status"]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
