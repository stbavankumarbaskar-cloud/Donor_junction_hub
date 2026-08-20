<?php
// create_campaign.php - Publish new campaign endpoint
require_once __DIR__ . '/db_config.php';

$raw = file_get_contents('php://input');
$data = json_decode($raw, true) ?: $_POST;

$org_mobile = isset($data['org_mobile']) ? trim($data['org_mobile']) : '';
$title = isset($data['title']) ? trim($data['title']) : '';
$date_time = isset($data['date_time']) ? trim($data['date_time']) : '';
$place = isset($data['place']) ? trim($data['place']) : '';
$status = isset($data['status']) ? trim($data['status']) : 'Active';
$status_color = isset($data['status_color']) ? trim($data['status_color']) : '#27500A';
$status_bg = isset($data['status_bg']) ? trim($data['status_bg']) : '#eaf3de';
$description = isset($data['description']) ? trim($data['description']) : '';
$collected = isset($data['collected']) ? (int)$data['collected'] : 0;
$target = isset($data['target']) ? (int)$data['target'] : 50;
$image_uri = isset($data['image_uri']) ? $data['image_uri'] : null;

if (empty($title)) {
    echo json_encode(['status' => 'error', 'message' => 'Campaign title is required']);
    exit();
}

if (!$pdo) {
    echo json_encode(['status' => 'success', 'message' => 'Campaign created (offline mode)', 'id' => (string)time()]);
    exit();
}

try {
    $org_name = 'Donor Junction Hub';
    if (!empty($org_mobile)) {
        $stmtOrg = $pdo->prepare("SELECT name FROM organizations WHERE mobile = :mobile LIMIT 1");
        $stmtOrg->execute(['mobile' => $org_mobile]);
        $row = $stmtOrg->fetch();
        if ($row && !empty($row['name'])) {
            $org_name = $row['name'];
        }
    }

    $sql = "INSERT INTO campaigns 
        (org_mobile, title, organization, place, location, date_time, status, status_color, status_bg, description, collected, target, image_uri) 
        VALUES 
        (:org_mobile, :title, :organization, :place, :location, :date_time, :status, :status_color, :status_bg, :description, :collected, :target, :image_uri)";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'org_mobile' => $org_mobile,
        'title' => $title,
        'organization' => $org_name,
        'place' => $place,
        'location' => $place,
        'date_time' => $date_time,
        'status' => $status,
        'status_color' => $status_color,
        'status_bg' => $status_bg,
        'description' => $description,
        'collected' => $collected,
        'target' => $target,
        'image_uri' => $image_uri
    ]);

    $insertId = $pdo->lastInsertId();

    echo json_encode([
        'status' => 'success',
        'message' => 'Campaign created successfully',
        'id' => (string)$insertId
    ]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
