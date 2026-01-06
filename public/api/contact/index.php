<?php
declare(strict_types=1);

header('Content-Type: application/json');

require_once __DIR__ . '/../helper/form.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, ['message' => 'Method not allowed']);
}

$config = load_company_config();
$allowedHosts = allowed_hosts($config['host']);
assert_origin($allowedHosts);

$expectedFields = ['name', 'company', 'city','email', 'phone', 'contactMethod',  'message', 'services', 'middle_name'];
$requiredFields = ['name', 'email'];
$unexpected = array_diff(array_keys($_POST), $expectedFields);
if (!empty($unexpected)) {
    respond(400, ['message' => 'Unexpected fields supplied.']);
}

$honeypot = clean_string($_POST['middle_name'] ?? '');
if ($honeypot !== '') {
    respond(200, ['message' => 'Message sent']);
}

$fields = [];
foreach ($expectedFields as $field) {
    $fields[$field] = clean_string($_POST[$field] ?? '');
}

$errors = [];
foreach ($requiredFields as $field) {
    if ($fields[$field] === '') {
        $errors[$field] = 'This field is required.';
    }
}

if ($fields['email'] !== '' && !filter_var($fields['email'], FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Please enter a valid email.';
}

if ($fields['phone'] !== '' && !preg_match('/^[0-9+()\\-\\s]{6,20}$/', $fields['phone'])) {
    $errors['phone'] = 'Please enter a valid phone number.';
}

if ($fields['contactMethod'] !== '' && !in_array($fields['contactMethod'], ['phone', 'email'], true)) {
    $errors['contactMethod'] = 'Invalid contact preference.';
}

if (!empty($errors)) {
    respond(400, ['message' => 'Validation failed', 'errors' => $errors]);
}

$rateKey = 'contact|' . $config['host'] . '|' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
if (!rate_limit($rateKey, 5, 900)) {
    respond(429, ['message' => 'Too many requests. Please try again later.']);
}

$bodyLines = [
    'New contact request:',
    'Name: ' . $fields['name'],
    'Email: ' . $fields['email'],
    'Phone: ' . ($fields['phone'] ?: 'N/A'),
    'Contact Preference: ' . ($fields['contactMethod'] ?: 'N/A'),
    'Company: ' . ($fields['company'] ?: 'N/A'),
    'City: ' . ($fields['city'] ?: 'N/A'),
    'Message:',
    $fields['message'],
];
$emailBody = implode("\n", $bodyLines);

$sent = send_mail($config['email'], 'New contact form submission', $emailBody, $fields['email'], $config['host']);

if (!$sent) {
    respond(500, ['message' => 'Unable to send message right now.']);
}

respond(200, ['message' => 'Message sent']);
