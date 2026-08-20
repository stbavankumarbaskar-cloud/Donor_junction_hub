<?php
// get_campaigns.php - Fetch campaigns for an organization
require_once __DIR__ . '/db_config.php';

$org_mobile = isset($_GET['org_mobile']) ? trim($_GET['org_mobile']) : '';

if (!$pdo) {
    echo json_encode([
        'status' => 'success',
        'campaigns' => [
            [
                'id' => '1',
                'title' => 'World Blood Day 2026',
                'date' => 'June 14 • 09:00 AM - 05:00 PM',
                'place' => 'Apollo Hospital Main Auditorium',
                'status' => 'Active',
                'statusColor' => '#27500A',
                'statusBg' => '#eaf3de',
                'description' => 'All blood groups • Target 50 donors',
                'collected' => 32,
                'target' => 50,
                'imageUri' => null
            ],
            [
                'id' => '2',
                'title' => 'A+ emergency drive',
                'date' => 'June 10–16 • 24 Hours Open',
                'place' => 'Chennai Central Blood Bank',
                'status' => 'Urgent',
                'statusColor' => '#A32D2D',
                'statusBg' => '#ffeaea',
                'description' => 'A+ only • 2 donors confirmed',
                'collected' => 3,
                'target' => 10,
                'imageUri' => null
            ]
        ]
    ]);
    exit();
}

try {
    if (!empty($org_mobile)) {
        $stmt = $pdo->prepare("SELECT * FROM campaigns WHERE org_mobile = :org_mobile OR org_mobile IS NULL ORDER BY created_at DESC");
        $stmt->execute(['org_mobile' => $org_mobile]);
    } else {
        $stmt = $pdo->query("SELECT * FROM campaigns ORDER BY created_at DESC");
    }
    
    $rows = $stmt->fetchAll();

    $result = [];
    foreach ($rows as $row) {
        $result[] = [
            'id' => (string)$row['id'],
            'title' => $row['title'],
            'date' => $row['date_time'] ?: ($row['date'] . ' ' . $row['time']),
            'place' => $row['place'] ?: $row['location'],
            'status' => $row['status'] ?: 'Active',
            'statusColor' => $row['status_color'] ?: '#27500A',
            'statusBg' => $row['status_bg'] ?: '#eaf3de',
            'description' => $row['description'] ?: '',
            'collected' => (int)($row['collected'] ?: 0),
            'target' => (int)($row['target'] ?: 50),
            'imageUri' => $row['image_uri'] ?: $row['image_url']
        ];
    }

    echo json_encode([
        'status' => 'success',
        'campaigns' => $result
    ]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
