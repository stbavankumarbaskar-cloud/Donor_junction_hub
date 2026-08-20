<?php
// get_pending_organizations.php - Fetch pending organizations for Super Admin
require_once __DIR__ . '/db_config.php';

if (!$pdo) {
    echo json_encode([
        'status' => 'success',
        'organizations' => [
            [
                'id' => '101',
                'name' => 'Rotary LifeCare NGO',
                'category' => 'NGO',
                'license' => 'NGO-TN-2023-991',
                'mobile' => '9123456789',
                'city' => 'Madurai',
                'address' => 'Anna Nagar Community Center, Madurai',
                'status' => 'pending'
            ]
        ]
    ]);
    exit();
}

try {
    $stmt = $pdo->query("SELECT * FROM organizations WHERE status = 'pending' ORDER BY created_at DESC");
    $orgs = $stmt->fetchAll();

    $result = [];
    foreach ($orgs as $org) {
        $result[] = [
            'id' => (string)$org['id'],
            'name' => $org['name'],
            'category' => $org['category'],
            'license' => $org['license'],
            'mobile' => $org['mobile'],
            'city' => $org['city'],
            'address' => $org['address'],
            'status' => $org['status'],
            'doc_uri' => $org['doc_uri'],
            'doc_type' => $org['doc_type'],
            'doc_name' => $org['doc_name']
        ];
    }

    echo json_encode([
        'status' => 'success',
        'organizations' => $result
    ]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
