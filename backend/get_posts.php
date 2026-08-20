<?php
// get_posts.php - Fetch blood request posts for inquiries
require_once __DIR__ . '/db_config.php';

if (!$pdo) {
    echo json_encode([
        'status' => 'success',
        'data' => [
            [
                'id' => '1',
                'title' => 'Muruganathan S',
                'mobile' => '9876500001',
                'location' => 'Madurai Medical College Hospital (GRH)',
                'city' => 'Madurai',
                'blood_group' => 'O+',
                'units_needed' => '2 units',
                'type' => 'urgent',
                'description' => 'Emergency surgery in Trauma Ward'
            ],
            [
                'id' => '2',
                'title' => 'Kausalya R',
                'mobile' => '9876500002',
                'location' => 'Apollo Speciality Hospital',
                'city' => 'Madurai',
                'blood_group' => 'B+',
                'units_needed' => '1 unit',
                'type' => 'urgent',
                'description' => 'ICU Patient, immediate requirement'
            ]
        ]
    ]);
    exit();
}

try {
    $stmt = $pdo->query("SELECT * FROM posts ORDER BY created_at DESC");
    $posts = $stmt->fetchAll();

    $result = [];
    foreach ($posts as $post) {
        $result[] = [
            'id' => (string)$post['id'],
            'title' => $post['patient_name'],
            'mobile' => $post['mobile'],
            'location' => $post['hospital'] . ($post['city'] ? ', ' . $post['city'] : ''),
            'city' => $post['city'],
            'blood_group' => $post['blood_group'],
            'units_needed' => $post['units'] . ($post['units'] == 1 ? ' unit' : ' units'),
            'type' => strtolower($post['urgency']) === 'critical' || strtolower($post['urgency']) === 'urgent' ? 'urgent' : 'normal',
            'description' => $post['note'] ?: "Blood requirement of {$post['blood_group']} at {$post['hospital']}"
        ];
    }

    echo json_encode([
        'status' => 'success',
        'data' => $result
    ]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
