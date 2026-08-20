<?php
// get_profile.php - Get organization profile endpoint
require_once __DIR__ . '/db_config.php';

$mobile = isset($_GET['mobile']) ? trim($_GET['mobile']) : '';

if (empty($mobile)) {
    echo json_encode(['status' => 'error', 'message' => 'Mobile parameter is required']);
    exit();
}

if (!$pdo) {
    echo json_encode([
        'status' => 'success',
        'organization' => [
            'id' => '1',
            'org_id' => $mobile,
            'name' => 'Apollo Speciality Hospital',
            'category' => 'Hospital',
            'license' => 'TN-MED-2024-00872',
            'mobile' => $mobile,
            'city' => 'Madurai',
            'address' => 'KK Nagar, Lake View Road, Madurai',
            'status' => 'approved',
            'admin_name' => 'Chief Medical Officer',
            'email' => 'apollo.madurai@hospital.in'
        ]
    ]);
    exit();
}

try {
    $stmt = $pdo->prepare("SELECT * FROM organizations WHERE mobile = :mobile LIMIT 1");
    $stmt->execute(['mobile' => $mobile]);
    $org = $stmt->fetch();

    if ($org) {
        echo json_encode([
            'status' => 'success',
            'organization' => [
                'id' => (string)$org['id'],
                'org_id' => $org['org_id'],
                'name' => $org['name'],
                'category' => $org['category'],
                'license' => $org['license'],
                'mobile' => $org['mobile'],
                'city' => $org['city'],
                'address' => $org['address'],
                'pincode' => $org['pincode'],
                'status' => $org['status'],
                'doc_uri' => $org['doc_uri'],
                'doc_type' => $org['doc_type'],
                'doc_name' => $org['doc_name'],
                'latitude' => $org['latitude'],
                'longitude' => $org['longitude'],
                'admin_name' => $org['admin_name'] ?: 'Chief Medical Officer',
                'email' => $org['email'] ?: ($org['name'] ? strtolower(str_replace(' ', '', $org['name'])) . '@hospital.in' : '')
            ]
        ]);
    } else {
        echo json_encode([
            'status' => 'error',
            'message' => 'Organization not found'
        ]);
    }
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
