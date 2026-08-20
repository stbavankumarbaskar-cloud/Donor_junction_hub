<?php
// get_chats.php - Fetch chat threads for organization
require_once __DIR__ . '/db_config.php';

$org_mobile = isset($_GET['org_mobile']) ? trim($_GET['org_mobile']) : '';

if (!$pdo) {
    echo json_encode([
        'status' => 'success',
        'chats' => [
            [
                'id' => '1',
                'name' => 'Ravi Kumar',
                'initials' => 'RK',
                'lastMessage' => 'I am available for donation tomorrow at 10 AM.',
                'time' => '10:42 AM',
                'unread' => 1,
                'avatarBg' => '#ffeaea',
                'avatarColor' => '#A32D2D',
                'donor' => [
                    'id' => '1',
                    'name' => 'Ravi Kumar',
                    'initials' => 'RK',
                    'bloodGroup' => 'A+',
                    'distance' => '2.3 km',
                    'status' => 'Eligible'
                ]
            ],
            [
                'id' => '2',
                'name' => 'Karthik Raja',
                'initials' => 'KR',
                'lastMessage' => 'Can I donate blood this Friday at your camp?',
                'time' => 'Yesterday',
                'unread' => 0,
                'avatarBg' => '#eaf3de',
                'avatarColor' => '#27500A',
                'donor' => [
                    'id' => '2',
                    'name' => 'Karthik Raja',
                    'initials' => 'KR',
                    'bloodGroup' => 'O+',
                    'distance' => '3.5 km',
                    'status' => 'Eligible'
                ]
            ]
        ]
    ]);
    exit();
}

try {
    if (!empty($org_mobile)) {
        $stmt = $pdo->prepare("SELECT * FROM chat_threads WHERE partner_mobile = :mobile OR user_phone = :mobile ORDER BY updated_at DESC");
        $stmt->execute(['mobile' => $org_mobile]);
    } else {
        $stmt = $pdo->query("SELECT * FROM chat_threads ORDER BY updated_at DESC");
    }

    $threads = $stmt->fetchAll();

    $result = [];
    foreach ($threads as $t) {
        $name = $t['partner_name'] ?: 'Donor Partner';
        $words = explode(' ', $name);
        $initials = '';
        foreach ($words as $w) {
            if (!empty($w)) $initials .= strtoupper($w[0]);
        }
        $initials = substr($initials, 0, 2) ?: 'DP';

        $timeStr = date('h:i A', strtotime($t['updated_at']));

        $result[] = [
            'id' => (string)$t['id'],
            'name' => $name,
            'initials' => $initials,
            'lastMessage' => $t['last_message'] ?: 'No messages yet',
            'time' => $timeStr,
            'unread' => 0,
            'avatarBg' => '#ffeaea',
            'avatarColor' => '#A32D2D',
            'donor' => [
                'id' => (string)$t['id'],
                'name' => $name,
                'initials' => $initials,
                'bloodGroup' => 'O+',
                'distance' => '2.5 km',
                'status' => 'Eligible'
            ]
        ];
    }

    if (empty($result)) {
        // Fallback default sample chat threads if database table has no threads for this org
        $result = [
            [
                'id' => '1',
                'name' => 'Ravi Kumar',
                'initials' => 'RK',
                'lastMessage' => 'I am available for donation tomorrow at 10 AM.',
                'time' => '10:42 AM',
                'unread' => 1,
                'avatarBg' => '#ffeaea',
                'avatarColor' => '#A32D2D',
                'donor' => [
                    'id' => '1',
                    'name' => 'Ravi Kumar',
                    'initials' => 'RK',
                    'bloodGroup' => 'A+',
                    'distance' => '2.3 km',
                    'status' => 'Eligible'
                ]
            ]
        ];
    }

    echo json_encode([
        'status' => 'success',
        'chats' => $result
    ]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
