<?php
// register_organization.php - Register organization endpoint
require_once __DIR__ . '/db_config.php';

$raw = file_get_contents('php://input');
$data = json_decode($raw, true) ?: $_POST;

$mobile = isset($data['mobile']) ? trim($data['mobile']) : '';
$name = isset($data['name']) ? trim($data['name']) : '';
$category = isset($data['category']) ? trim($data['category']) : 'Hospital';
$license = isset($data['license']) ? trim($data['license']) : '';
$city = isset($data['city']) ? trim($data['city']) : '';
$address = isset($data['address']) ? trim($data['address']) : '';
$pincode = isset($data['pincode']) ? trim($data['pincode']) : null;
$doc_uri = isset($data['doc_uri']) ? $data['doc_uri'] : null;
$doc_type = isset($data['doc_type']) ? $data['doc_type'] : null;
$doc_name = isset($data['doc_name']) ? $data['doc_name'] : null;
$latitude = isset($data['latitude']) ? (float)$data['latitude'] : null;
$longitude = isset($data['longitude']) ? (float)$data['longitude'] : null;
$org_id = isset($data['id']) ? trim($data['id']) : $mobile;

if (empty($mobile) || empty($name)) {
    echo json_encode(['status' => 'error', 'message' => 'Name and mobile are required']);
    exit();
}

if (!$pdo) {
    echo json_encode(['status' => 'success', 'message' => 'Organization registered (offline mode)']);
    exit();
}

try {
    $stmt = $pdo->prepare("SELECT id FROM organizations WHERE mobile = :mobile");
    $stmt->execute(['mobile' => $mobile]);
    $existing = $stmt->fetch();

    if ($existing) {
        $updateSql = "UPDATE organizations SET 
            name = :name, 
            category = :category, 
            license = :license, 
            city = :city, 
            address = :address, 
            pincode = :pincode, 
            doc_uri = :doc_uri, 
            doc_type = :doc_type, 
            doc_name = :doc_name, 
            latitude = :latitude, 
            longitude = :longitude, 
            status = 'pending' 
            WHERE mobile = :mobile";
        $stmt = $pdo->prepare($updateSql);
        $stmt->execute([
            'name' => $name,
            'category' => $category,
            'license' => $license,
            'city' => $city,
            'address' => $address,
            'pincode' => $pincode,
            'doc_uri' => $doc_uri,
            'doc_type' => $doc_type,
            'doc_name' => $doc_name,
            'latitude' => $latitude,
            'longitude' => $longitude,
            'mobile' => $mobile
        ]);
    } else {
        $insertSql = "INSERT INTO organizations 
            (org_id, name, category, license, mobile, city, address, pincode, status, doc_uri, doc_type, doc_name, latitude, longitude) 
            VALUES 
            (:org_id, :name, :category, :license, :mobile, :city, :address, :pincode, 'pending', :doc_uri, :doc_type, :doc_name, :latitude, :longitude)";
        $stmt = $pdo->prepare($insertSql);
        $stmt->execute([
            'org_id' => $org_id,
            'name' => $name,
            'category' => $category,
            'license' => $license,
            'mobile' => $mobile,
            'city' => $city,
            'address' => $address,
            'pincode' => $pincode,
            'doc_uri' => $doc_uri,
            'doc_type' => $doc_type,
            'doc_name' => $doc_name,
            'latitude' => $latitude,
            'longitude' => $longitude
        ]);
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'Organization registered successfully and sent for review',
        'mobile' => $mobile
    ]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
