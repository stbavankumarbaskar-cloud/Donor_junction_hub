-- ============================================================
-- DONOR JUNCTION DATABASE SCHEMA (donor_junction)
-- Complete MySQL database schema and initial seed data
-- ============================================================

CREATE DATABASE IF NOT EXISTS `donor_junction` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `donor_junction`;

-- ------------------------------------------------------------
-- 1. USERS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `mobile` VARCHAR(20) NOT NULL UNIQUE,
  `email` VARCHAR(100) DEFAULT NULL,
  `blood_group` VARCHAR(10) NOT NULL,
  `city` VARCHAR(100) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `profile_image` LONGTEXT DEFAULT NULL,
  `latitude` DECIMAL(10, 8) DEFAULT NULL,
  `longitude` DECIMAL(11, 8) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 2. BLOOD POSTS TABLE (Requests for Blood)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `posts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `patient_name` VARCHAR(100) NOT NULL,
  `blood_group` VARCHAR(10) NOT NULL,
  `units` INT DEFAULT 1,
  `hospital` VARCHAR(150) NOT NULL,
  `city` VARCHAR(100) NOT NULL,
  `mobile` VARCHAR(20) NOT NULL,
  `urgency` ENUM('Urgent', 'Normal', 'Critical') DEFAULT 'Normal',
  `note` TEXT DEFAULT NULL,
  `latitude` DECIMAL(10, 8) DEFAULT NULL,
  `longitude` DECIMAL(11, 8) DEFAULT NULL,
  `status` ENUM('Active', 'Completed', 'Cancelled') DEFAULT 'Active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 3. ORGANIZATIONS TABLE (Hospitals, Blood Banks, NGOs)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `organizations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `org_id` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `category` ENUM('Hospital', 'NGO', 'Blood Bank', 'Other') NOT NULL DEFAULT 'Hospital',
  `license` VARCHAR(100) NOT NULL,
  `mobile` VARCHAR(20) NOT NULL UNIQUE,
  `city` VARCHAR(100) NOT NULL,
  `address` TEXT NOT NULL,
  `pincode` VARCHAR(20) DEFAULT NULL,
  `status` ENUM('pending', 'approved', 'declined') NOT NULL DEFAULT 'pending',
  `doc_uri` LONGTEXT DEFAULT NULL,
  `doc_type` VARCHAR(20) DEFAULT NULL,
  `doc_name` VARCHAR(255) DEFAULT NULL,
  `latitude` DECIMAL(10, 8) DEFAULT NULL,
  `longitude` DECIMAL(11, 8) DEFAULT NULL,
  `admin_name` VARCHAR(100) DEFAULT 'Chief Medical Officer',
  `email` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 4. CAMPAIGNS TABLE (Blood Drive Camps)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `campaigns` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `org_mobile` VARCHAR(20) DEFAULT NULL,
  `title` VARCHAR(150) NOT NULL,
  `organization` VARCHAR(150) DEFAULT NULL,
  `place` VARCHAR(200) DEFAULT NULL,
  `location` VARCHAR(200) DEFAULT NULL,
  `date` VARCHAR(50) DEFAULT NULL,
  `time` VARCHAR(50) DEFAULT NULL,
  `date_time` VARCHAR(100) DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT 'Active',
  `status_color` VARCHAR(50) DEFAULT '#27500A',
  `status_bg` VARCHAR(50) DEFAULT '#eaf3de',
  `description` TEXT DEFAULT NULL,
  `collected` INT DEFAULT 0,
  `target` INT DEFAULT 50,
  `image_uri` LONGTEXT DEFAULT NULL,
  `image_url` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 4. BLOGS TABLE (Articles and Guides)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `blogs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `org_name` VARCHAR(150) DEFAULT 'Donor Junction Trust',
  `description` TEXT NOT NULL,
  `image_uri` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 5. LOCATIONS TABLE (Blood Banks and Hospitals)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `locations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `type` ENUM('Blood Bank', 'Hospital', 'Camp') DEFAULT 'Blood Bank',
  `address` VARCHAR(255) NOT NULL,
  `latitude` DECIMAL(10, 8) NOT NULL,
  `longitude` DECIMAL(11, 8) NOT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `available_groups` VARCHAR(100) DEFAULT 'A+, B+, O+, AB+',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 6. CERTIFICATES TABLE (Donation Certificates)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `certificates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `mobile` VARCHAR(20) NOT NULL,
  `donor_name` VARCHAR(100) NOT NULL,
  `donation_date` VARCHAR(50) NOT NULL,
  `certificate_code` VARCHAR(50) NOT NULL,
  `certificate_url` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 7. SCHEDULE DONATIONS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `schedule_donations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_mobile` VARCHAR(20) NOT NULL,
  `donor_name` VARCHAR(100) NOT NULL,
  `blood_group` VARCHAR(10) NOT NULL,
  `center_name` VARCHAR(150) NOT NULL,
  `donation_date` VARCHAR(50) NOT NULL,
  `time_slot` VARCHAR(50) NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `status` ENUM('Scheduled', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 8. CHAT THREADS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `chat_threads` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_phone` VARCHAR(20) NOT NULL,
  `partner_mobile` VARCHAR(20) NOT NULL,
  `partner_name` VARCHAR(100) NOT NULL,
  `partner_type` VARCHAR(50) DEFAULT 'hospital',
  `last_message` TEXT DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `user_partner_unique` (`user_phone`, `partner_mobile`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 9. CHAT MESSAGES TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_phone` VARCHAR(20) NOT NULL,
  `partner_mobile` VARCHAR(20) NOT NULL,
  `partner_name` VARCHAR(100) NOT NULL,
  `sender` ENUM('user', 'partner') NOT NULL,
  `text` TEXT NOT NULL,
  `timestamp` VARCHAR(50) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- INITIAL SEED DATA
-- ============================================================

-- Seed Users (20 Records)
INSERT INTO `users` (`name`, `mobile`, `email`, `blood_group`, `city`, `password`, `latitude`, `longitude`) VALUES
('Ravi Kumar', '9123456789', 'ravi@example.com', 'A+', 'Madurai', '123456', 9.9252, 78.1198),
('Karthik Raja', '9876500001', 'karthik.r@example.com', 'O+', 'Madurai', '123456', 9.9328, 78.1281),
('Anitha Sundaram', '9876500002', 'anitha.s@example.com', 'B+', 'Madurai', '123456', 9.9298, 78.1402),
('Muthu Pandian', '9876500003', 'muthu.p@example.com', 'AB+', 'Madurai', '123456', 9.9220, 78.1450),
('Deepak Selvam', '9876500004', 'deepak.s@example.com', 'O-', 'Madurai', '123456', 9.9430, 78.1560),
('Priya Vijay', '9876500005', 'priya.v@example.com', 'A-', 'Madurai', '123456', 9.9165, 78.1145),
('Suresh Kumar', '9876500006', 'suresh.k@example.com', 'B-', 'Madurai', '123456', 9.9350, 78.1320),
('Kavitha Ram', '9876500007', 'kavitha.r@example.com', 'AB-', 'Madurai', '123456', 9.9050, 78.1020),
('Ganesh Babu', '9876500008', 'ganesh.b@example.com', 'O+', 'Madurai', '123456', 9.9380, 78.1190),
('Meenakshi Sundaram', '9876500009', 'meenakshi.s@example.com', 'A+', 'Madurai', '123456', 9.8820, 78.0710),
('Senthil Nathan', '9876500010', 'senthil.n@example.com', 'B+', 'Madurai', '123456', 9.9310, 78.1050),
('Divya Bharathi', '9876500011', 'divya.b@example.com', 'O+', 'Madurai', '123456', 9.8970, 78.1210),
('Arun Prakash', '9876500012', 'arun.p@example.com', 'A+', 'Madurai', '123456', 9.9080, 78.1050),
('Lakshmi Narayanan', '9876500013', 'lakshmi.n@example.com', 'B+', 'Madurai', '123456', 9.9410, 78.1360),
('Vigneshwaran M', '9876500014', 'vignesh.m@example.com', 'O-', 'Madurai', '123456', 9.9140, 78.1480),
('Soundarya R', '9876500015', 'soundarya.r@example.com', 'AB+', 'Madurai', '123456', 10.0540, 77.9540),
('Balamurugan K', '9876500016', 'bala.k@example.com', 'A-', 'Madurai', '123456', 10.0460, 78.3370),
('Revathi Sekar', '9876500017', 'revathi.s@example.com', 'B-', 'Madurai', '123456', 9.8220, 77.9890),
('Saravanan P', '9876500018', 'saravanan.p@example.com', 'O+', 'Madurai', '123456', 10.0240, 77.9620),
('Bavankumar S', '9876543210', 'bavan@example.com', 'O+', 'Madurai', '123456', 9.9650, 78.1750);

-- Seed Blood Posts (20 Records - Madurai City Zone)
INSERT INTO `posts` (`patient_name`, `blood_group`, `units`, `hospital`, `city`, `mobile`, `urgency`, `note`, `latitude`, `longitude`) VALUES
('Muruganathan S', 'O+', 2, 'Madurai Medical College Hospital (GRH)', 'Madurai', '9876500001', 'Critical', 'Emergency surgery in Trauma Ward', 9.9252, 78.1198),
('Kausalya R', 'B+', 1, 'Apollo Speciality Hospital', 'Madurai', '9876500002', 'Urgent', 'ICU Patient, immediate requirement', 9.9298, 78.1402),
('Dhanush Kumar', 'A+', 3, 'Meenakshi Mission Hospital & Research Centre', 'Madurai', '9876500003', 'Normal', 'Scheduled bypass surgery tomorrow', 9.9430, 78.1560),
('Kamala Kannan', 'AB+', 2, 'Velammal Medical College Hospital', 'Madurai', '9876500004', 'Urgent', 'Emergency blood transfusion needed', 9.9650, 78.1750),
('Vijaya Lakshmi', 'O-', 1, 'Devadoss Multispeciality Hospital', 'Madurai', '9876500005', 'Critical', 'Rare O negative blood needed urgently', 9.9328, 78.1281),
('Subramanian M', 'A-', 2, 'Vadamalayan Hospitals', 'Madurai', '9876500006', 'Urgent', 'Platelet requirement for dengue patient', 9.9350, 78.1320),
('Ponmani T', 'B-', 2, 'AR Hospital', 'Madurai', '9876500007', 'Normal', 'Elective surgery requirement', 9.9220, 78.1450),
('Senthamarai K', 'AB-', 1, 'Preethi Multispeciality Hospital', 'Madurai', '9876500008', 'Critical', 'Accident emergency case', 9.9380, 78.1190),
('Gurusamy P', 'O+', 3, 'Grace Kennett Foundation Hospital', 'Madurai', '9876500009', 'Normal', 'Anemia treatment blood transfusion', 9.9165, 78.1145),
('Narayanan S', 'B+', 2, 'Christian Mission Hospital', 'Madurai', '9876500010', 'Urgent', 'Surgical unit requirement', 9.9214, 78.1220),
('Chellammal M', 'A+', 1, 'Bose Hospital', 'Madurai', '9876500011', 'Normal', 'Post-maternity recovery unit', 9.9080, 78.1050),
('Pandiarajan K', 'O+', 2, 'Harshitha Hospital', 'Madurai', '9876500012', 'Urgent', 'Dialysis patient support', 9.8970, 78.1210),
('Janaki Raman', 'B+', 1, 'Guru Hospital', 'Madurai', '9876500013', 'Critical', 'Oncology department emergency', 9.9410, 78.1360),
('Alagarsamy R', 'A+', 2, 'Quality Care Hospital', 'Madurai', '9876500014', 'Urgent', 'Gastroenterology department requirement', 9.9140, 78.1480),
('Geetha Govind', 'AB+', 1, 'City Hospital Madurai', 'Madurai', '9876500015', 'Normal', 'General ward recovery', 9.9050, 78.1020),
('Manikandan V', 'O-', 2, 'Sundaram Medical Foundation', 'Madurai', '9876500016', 'Critical', 'Emergency O Negative request', 9.8820, 78.0710),
('Thangaraj S', 'A-', 1, 'St Joseph Hospital', 'Madurai', '9876500017', 'Urgent', 'Orthopedic surgery requirement', 9.9310, 78.1050),
('Padmavathi M', 'B-', 2, 'Government Rajaji Hospital (ER)', 'Madurai', '9876500018', 'Critical', 'Maternity emergency delivery', 9.9328, 78.1281),
('Venkatesan G', 'O+', 3, 'Meenakshi Hospital Anna Nagar', 'Madurai', '9876500019', 'Normal', 'Heart valve replacement prep', 9.9220, 78.1450),
('Rajeshwari N', 'A+', 2, 'Apollo Cancer Centre Madurai', 'Madurai', '9876543210', 'Urgent', 'Chemotherapy supportive care', 9.9298, 78.1402);

-- Seed Organizations
INSERT INTO `organizations` (`org_id`, `name`, `category`, `license`, `mobile`, `city`, `address`, `pincode`, `status`, `admin_name`, `email`, `latitude`, `longitude`) VALUES
('9840012345', 'Apollo Speciality Hospital', 'Hospital', 'TN-MED-2024-00872', '9840012345', 'Madurai', 'KK Nagar, Lake View Road, Madurai - 625020', '625020', 'approved', 'Dr. Ramesh Kumar (CMO)', 'apollo.madurai@hospital.in', 9.9298, 78.1402),
('9876543210', 'Meenakshi Mission Blood Bank', 'Blood Bank', 'TN-BB-2025-00124', '9876543210', 'Madurai', 'Lake Area, Mattuthavani, Madurai - 625107', '625107', 'approved', 'Dr. Senthil V (Medical Director)', 'mmh.bloodbank@hospital.in', 9.9430, 78.1560),
('9123456789', 'Rotary LifeCare NGO', 'NGO', 'NGO-TN-2023-991', '9123456789', 'Madurai', 'Anna Nagar Community Center, Madurai - 625020', '625020', 'pending', 'Santhosh M (Coordinator)', 'rotary.lifecare@ngo.org', 9.9252, 78.1198),
('9876500001', 'Velammal Medical Foundation', 'Hospital', 'TN-MED-2025-01042', '9876500001', 'Madurai', 'Ring Road, Anuppanadi, Madurai - 625009', '625009', 'pending', 'Dr. Anbarasan P', 'velammal.med@hospital.in', 9.9650, 78.1750);

-- Seed Campaigns (Hub Campaigns)
INSERT INTO `campaigns` (`org_mobile`, `title`, `organization`, `place`, `location`, `date`, `time`, `date_time`, `status`, `status_color`, `status_bg`, `description`, `collected`, `target`) VALUES
('9840012345', 'World Blood Day 2026', 'Apollo Speciality Hospital', 'Apollo Hospital Main Auditorium', 'KK Nagar, Madurai', 'June 14', '09:00 AM - 05:00 PM', 'June 14 • 09:00 AM - 05:00 PM', 'Active', '#27500A', '#eaf3de', 'All blood groups • Target 50 donors', 32, 50),
('9840012345', 'A+ emergency drive', 'Apollo Speciality Hospital', 'Madurai Central Blood Bank', 'Goripalayam, Madurai', 'June 10-16', '24 Hours Open', 'June 10–16 • 24 Hours Open', 'Urgent', '#A32D2D', '#ffeaea', 'A+ only • Urgent requirement for trauma ward', 3, 10),
('9876543210', 'Monthly thalassemia donors drive', 'Meenakshi Mission Blood Bank', 'Red Cross Society Clinic', 'Tallakulam, Madurai', 'Recurring', '10:00 AM - 02:00 PM', 'Recurring • 10:00 AM - 02:00 PM', 'Open', '#0C447C', '#e6f1fb', 'O- only • Regular thalassemia support', 0, 5);

-- Seed Blogs (20 Records)
INSERT INTO `blogs` (`title`, `org_name`, `description`) VALUES
('Why Donating Blood Regularly Saves 3 Lives', 'Tamil Nadu Blood Donor Federation', 'Every single unit of blood donated can be separated into red cells, plasma, and platelets to help three different patients in critical need.'),
('Eligibility Criteria for First-Time Donors in Madurai', 'Donor Junction Medical Board', 'Learn about age requirements, body weight standards, hemoglobin levels, and health guidelines before your first donation.'),
('The Science Behind Blood Types & Compatibility Matrix', 'Madurai Medical College Research', 'Understanding how A, B, AB, and O blood types interact, and why O negative is the universal red blood cell donor.'),
('How to Boost Hemoglobin Naturally Before Donation', 'Madurai Health & Nutrition Cell', 'Top iron-rich foods including beetroot, spinach, dates, pomegranates, and lean meats to prepare your body for blood donation.'),
('Platelet Donation vs Whole Blood Donation: What is the Difference?', 'Apollo Hospitals Blood Centre', 'Discover how apheresis allows donors to give concentrated platelets every 15 days, critical for dengue and cancer care.'),
('Myths vs Facts About Blood Donation', 'Tamil Nadu Health Department', 'Busting common misconceptions about weakness, pain, infection risks, and recovery time post-donation.'),
('Donating Blood During Summer Months in Madurai', 'Grace Kennett Foundation', 'Hydration tips and post-donation guidelines to ensure maximum comfort and quick stamina recovery during warm weather.'),
('The Role of Rare Blood Groups in Emergency Traumas', 'Meenakshi Mission Hospital Team', 'Why rare types like O negative, AB negative, and Bombay blood group require special donor registries and quick response teams.'),
('What Happens to Your Blood After Donation?', 'Rotary City Blood Bank Madurai', 'Follow the journey of donated blood from collection bags through lab testing, centrifuging, component separation, and storage.'),
('Donating Blood as a Regular Lifesaving Habit', 'Red Cross Society Madurai', 'Health benefits for regular donors including iron level regulation, enhanced cardiovascular wellness, and free mini health checkups.'),
('Preparation Tips the Night Before Blood Donation', 'Devadoss Hospital Wellness Wing', 'Getting 7-8 hours of sleep, avoiding fatty meals, and drinking 500ml of water right before arriving at the donation center.'),
('Dengue Awareness & Urgent Platelet Requirements in Tamil Nadu', 'Vadamalayan Hospitals Editorial', 'Understanding dengue fever drop in blood platelet counts and how voluntary donor responses protect patients in critical condition.'),
('Corporate & College Blood Drives in Madurai Zone', 'Donor Junction Community Engagement', 'How educational institutions and corporate offices can host high-impact blood donation camps with medical certification.'),
('Understanding Rh Factor & Pregnancy Compatibility', 'Velammal Medical College Department', 'Why knowing whether your blood group is positive or negative matters during pregnancy and blood transfusion safety.'),
('How Often Can You Safely Donate Blood?', 'Indian Red Cross Guidelines', 'Men can donate whole blood every 3 months, while women can safely donate every 4 months to allow iron store replenishment.'),
('Post-Donation Care: What to Eat and Do After Giving Blood', 'AR Hospital Clinical Nutritionists', 'Enjoying juices, snacks, avoiding heavy lifting for 5 hours, and staying hydrated post-donation.'),
('The History & Legacy of World Blood Donor Day', 'WHO Health Information Desk', 'Celebrating June 14th annually to honor voluntary non-remunerated blood donors worldwide for their lifesaving gift.'),
('Emergency Blood Requests: How Donor Junction Connects Nearby Heroes', 'Donor Junction Tech & Lifesaving Team', 'How real-time location mapping and direct WhatsApp/chat connections accelerate donor response times during emergencies.'),
('Iron Deficiency Anemia: Signs, Prevention & Blood Health', 'Christian Mission Hospital Wellness', 'Recognizing fatigue, pale skin, and low stamina symptoms, and building iron reserves through dietary changes.'),
('Empowering Women Blood Donors in Tamil Nadu', 'Madurai Women Lifesavers Forum', 'Encouraging young women and female college students to participate in blood donation drives with confidence.');

-- Seed Locations (20 Records - Madurai City Zone)
INSERT INTO `locations` (`name`, `type`, `address`, `latitude`, `longitude`, `phone`, `available_groups`) VALUES
('Government Rajaji Hospital Blood Bank', 'Blood Bank', 'Panagal Road, Goripalayam, Madurai - 625020', 9.9328, 78.1281, '0452-2532536', 'All Blood Groups (A+, B+, O+, AB+, O-)'),
('Meenakshi Mission Hospital Blood Centre', 'Blood Bank', 'Lake Area, Mattuthavani, Madurai - 625107', 9.9430, 78.1560, '0452-2588000', 'A+, B+, O+, AB+, A-, B-, O-'),
('Apollo Speciality Hospital Blood Bank', 'Hospital', 'KK Nagar, Lake View Road, Madurai - 625020', 9.9298, 78.1402, '0452-2580000', 'A+, B+, O+, AB+'),
('Velammal Medical College Hospital Blood Centre', 'Hospital', 'Ring Road, Anuppanadi, Madurai - 625009', 9.9650, 78.1750, '0452-7110000', 'All Blood Groups'),
('Devadoss Multispeciality Hospital', 'Hospital', 'Surveyor Colony, K.Pudur, Madurai - 625007', 9.9410, 78.1360, '0452-2566100', 'A+, B+, O+, AB+'),
('Vadamalayan Blood Bank', 'Blood Bank', 'Jawahar Road, Chokkikulam, Madurai - 625002', 9.9350, 78.1320, '0452-2545400', 'A+, B+, O+, O-, AB+'),
('Grace Kennett Foundation Blood Centre', 'Blood Bank', '7, Kennett Road, Ellis Nagar, Madurai - 625016', 9.9165, 78.1145, '0452-2300400', 'A+, B+, O+, AB+'),
('Rotary City Blood Bank Madurai', 'Blood Bank', 'Simmakkal, Main Road, Madurai - 625001', 9.9214, 78.1220, '0452-2341234', 'A+, B+, O+, AB+, O-'),
('Red Cross Society Blood Bank Madurai', 'Blood Bank', 'Tallakulam, Near Outpost, Madurai - 625002', 9.9360, 78.1340, '0452-2531122', 'All Blood Groups'),
('AR Hospital Blood Center', 'Hospital', '162, Anna Nagar Main Road, Madurai - 625020', 9.9220, 78.1450, '0452-4392200', 'A+, B+, O+, AB+'),
('Preethi Hospitals Blood Center', 'Hospital', '50, Melur Main Road, K.Pudur, Madurai - 625007', 9.9420, 78.1390, '0452-2568888', 'A+, B+, O+'),
('Guru Hospital Blood Bank', 'Blood Bank', '4/612, Ring Road, Mattuthavani, Madurai - 625107', 9.9440, 78.1580, '0452-2589999', 'A+, B+, O+, AB+'),
('Bose Hospital & Blood Storage Unit', 'Hospital', '140, Kamarajar Salai, Madurai - 625009', 9.9180, 78.1310, '0452-2334455', 'A+, B+, O+'),
('Christian Mission Hospital Blood Unit', 'Hospital', 'East Veli Street, Madurai - 625001', 9.9170, 78.1240, '0452-2323232', 'A+, B+, O+, AB+'),
('Quality Care Blood Bank', 'Blood Bank', 'TVS Nagar Main Road, Palanganatham, Madurai - 625003', 9.9080, 78.1050, '0452-2377788', 'A+, B+, O+'),
('Thiruparankundram Lions Blood Camp', 'Camp', 'Near Temple Car Street, Thiruparankundram, Madurai - 625005', 9.8820, 78.0710, '0452-2882233', 'A+, B+, O+, AB+'),
('Arappalayam Community Blood Drive', 'Camp', 'Bus Stand Complex, Arappalayam, Madurai - 625016', 9.9310, 78.1050, '0452-2601122', 'A+, B+, O+'),
('Villapuram Rotary Lifesaving Camp', 'Camp', 'Aruppukottai Main Road, Villapuram, Madurai - 625012', 9.8970, 78.1210, '0452-2678899', 'All Blood Groups'),
('Teppakulam Youth Blood Camp', 'Camp', 'Vandiyur Mariamman Teppakulam, Madurai - 625009', 9.9140, 78.1480, '0452-2456677', 'A+, B+, O+, AB+'),
('Melur Government Hospital Blood Storage Centre', 'Hospital', 'Trichy Main Road, Melur, Madurai - 625106', 10.0460, 78.3370, '0452-2734100', 'A+, B+, O+, AB+');

-- Seed Certificates
INSERT INTO `certificates` (`mobile`, `donor_name`, `donation_date`, `certificate_code`) VALUES
('9876543210', 'John Doe', '2026-05-15', 'CERT-DJ-2026-001'),
('9123456789', 'Ravi Kumar', '2026-06-20', 'CERT-DJ-2026-002');
