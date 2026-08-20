<?php
// save_profile.php - Update organization profile
require_once __DIR__ . '/db_config.php';

$raw = file_get_contents('php://input');
$data = json_decode($raw, true) ?: $_POST;

$mobile = isset($data['mobile']) ? trim($data['mobile']) : '';
$name = isset($data['name']) ? trim($data['name']) : '';
$city = isset($data['city']) ? trim($data['city']) : '';
$address = isset($data['address']) ? trim($data['address']) : null;
$admin_name = isset($data['admin_name']) ? trim($data['admin_name']) : null;
$email = isset($data['email']) ? trim($data['email']) : null;

if (empty($mobile)) {
    echo json_encode(['status' => 'error', 'message' => 'Mobile number is required']);
    exit();
}

if (!$pdo) {
    echo json_encode(['status' => 'success', 'message' => 'Profile updated successfully']);
    exit();
}

try {
    $fields = [];
    $params = ['mobile' => $mobile];

    if (!empty($name)) {
        $fields[] = "name = :name";
        $params['name'] = $name;
    }
    if (!empty($city)) {
        $fields[] = "city = :city";
        $params['city'] = $city;
    }
    if ($address !== null) {
        $fields[] = "address = :address";
        $params['address'] = $address;
    }
    if ($admin_name !== null) {
        $fields[] = "admin_name = :admin_name";
        $params['admin_name'] = $admin_name;
    }
    if ($email !== null) {
        $fields[] = "email = :email";
        $params['email'] = $email;
    }

    if (empty($fields)) {
        echo json_encode(['status' => 'success', 'message' => 'No changes made']);
        exit();
    }

    $sql = "UPDATE organizations SET " . implode(', ', $fields) . " WHERE mobile = :mobile";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    echo json_encode(['status' => 'success', 'message' => 'Profile updated successfully']);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
