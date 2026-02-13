<?php
declare(strict_types=1);

header('Content-Type: application/json');

require_once __DIR__ . '/../helper/form.php';

function flatten_uploads_entry(?array $entry): array
{
    if (!is_array($entry) || !isset($entry['name'])) {
        return [];
    }

    if (is_array($entry['name'])) {
        $files = [];
        foreach ($entry['name'] as $idx => $name) {
            $files[] = [
                'name' => (string)($name ?? ''),
                'type' => (string)($entry['type'][$idx] ?? ''),
                'tmp_name' => (string)($entry['tmp_name'][$idx] ?? ''),
                'error' => (int)($entry['error'][$idx] ?? UPLOAD_ERR_NO_FILE),
                'size' => (int)($entry['size'][$idx] ?? 0),
            ];
        }
        return $files;
    }

    return [[
        'name' => (string)($entry['name'] ?? ''),
        'type' => (string)($entry['type'] ?? ''),
        'tmp_name' => (string)($entry['tmp_name'] ?? ''),
        'error' => (int)($entry['error'] ?? UPLOAD_ERR_NO_FILE),
        'size' => (int)($entry['size'] ?? 0),
    ]];
}

function parse_image_uploads(string $field, int $maxFiles = 3, int $maxFileSizeMb = 5): array
{
    $result = ['files' => [], 'error' => null];
    $files = flatten_uploads_entry($_FILES[$field] ?? null);
    $present = array_values(array_filter($files, function ($file) {
        return (int)($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE;
    }));

    if (empty($present)) {
        return $result;
    }

    if (count($present) > $maxFiles) {
        $result['error'] = 'Too many files uploaded.';
        return $result;
    }

    $maxBytes = $maxFileSizeMb * 1024 * 1024;
    $finfo = function_exists('finfo_open') ? finfo_open(FILEINFO_MIME_TYPE) : null;

    $blockedExtensions = [
        '.php', '.phtml', '.php3', '.php4', '.php5', '.phar',
        '.pl', '.py', '.rb', '.cgi', '.asp', '.aspx', '.jsp',
        '.js', '.mjs', '.cjs', '.sh', '.bash', '.zsh', '.ps1',
        '.bat', '.cmd', '.com', '.exe', '.msi', '.dll', '.so', '.dylib',
        '.jar', '.vbs', '.wsf', '.hta', '.html', '.htm', '.xhtml',
        '.shtml', '.css', '.scss', '.sass', '.less', '.xml', '.svg',
    ];

    $allowedImageExtensions = [
        '.jpg', '.jpeg', '.png', '.webp', '.gif',
        '.bmp', '.tiff', '.tif', '.avif', '.heif', '.heic',
    ];

    foreach ($present as $file) {
        $errCode = (int)($file['error'] ?? UPLOAD_ERR_NO_FILE);
        if ($errCode !== UPLOAD_ERR_OK) {
            if ($finfo) {
                finfo_close($finfo);
            }
            $result['error'] = 'One of the uploaded files is invalid.';
            return $result;
        }

        $tmp = (string)($file['tmp_name'] ?? '');
        if ($tmp === '' || !is_uploaded_file($tmp)) {
            if ($finfo) {
                finfo_close($finfo);
            }
            $result['error'] = 'Invalid uploaded file.';
            return $result;
        }

        $size = (int)($file['size'] ?? 0);
        if ($size > $maxBytes) {
            if ($finfo) {
                finfo_close($finfo);
            }
            $result['error'] = 'File is too large.';
            return $result;
        }

        $providedType = (string)($file['type'] ?? '');
        $mime = $finfo ? (string)(finfo_file($finfo, $tmp) ?: $providedType) : $providedType;
        $filename = (string)($file['name'] ?? '');
        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        $extension = $extension !== '' ? '.' . $extension : '';

        if (in_array($extension, $blockedExtensions, true)) {
            if ($finfo) {
                finfo_close($finfo);
            }
            $result['error'] = 'Blocked file extension.';
            return $result;
        }

        $safeMime = strtolower(trim($mime));
        $isDangerousMime =
            preg_match('/^text\\//i', $safeMime) ||
            preg_match('/^application\\/(javascript|x-javascript|ecmascript|x-httpd-php|x-php|x-sh|x-msdownload|x-dosexec|x-executable|x-bat|x-csh)/i', $safeMime) ||
            preg_match('/^application\\/html/i', $safeMime) ||
            preg_match('/^image\\/svg\\+xml/i', $safeMime);

        if ($isDangerousMime) {
            if ($finfo) {
                finfo_close($finfo);
            }
            $result['error'] = 'Blocked file content type.';
            return $result;
        }

        $isImageMime = str_starts_with($safeMime, 'image/') && $safeMime !== 'image/svg+xml';
        $isImageExt = in_array($extension, $allowedImageExtensions, true);
        if (!$isImageMime && !$isImageExt) {
            if ($finfo) {
                finfo_close($finfo);
            }
            $result['error'] = 'Only image files are allowed.';
            return $result;
        }

        $result['files'][] = [
            'name' => basename((string)($file['name'] ?? 'image')),
            'tmp_name' => $tmp,
            'mime' => $mime,
        ];
    }

    if ($finfo) {
        finfo_close($finfo);
    }

    return $result;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, ['message' => 'Method not allowed']);
}

$config = load_company_config();
$allowedHosts = allowed_hosts($config['host']);
assert_origin($allowedHosts);

$expectedFields = [
    'name',
    'company',
    'city',
    'email',
    'phone',
    'contactMethod',
    'message',
    'services',
    'reference_images',
    'middle_name',
];
$requiredFields = ['name', 'email'];
$allowedIncoming = array_merge($expectedFields, array_map(fn($name) => $name . '[]', $expectedFields));
$incomingNames = array_unique(array_merge(array_keys($_POST), array_keys($_FILES)));
$unexpected = array_diff($incomingNames, $allowedIncoming);
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

$upload = parse_image_uploads('reference_images', 3, 5);
if (!empty($upload['error'])) {
    $errors['reference_images'] = $upload['error'];
}
$attachments = $upload['files'] ?? [];
$fields['reference_images'] = empty($attachments)
    ? ''
    : implode(', ', array_map(fn($file) => (string)$file['name'], $attachments));

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
    'Reference Images: ' . ($fields['reference_images'] ?: 'N/A'),
    'Message:',
    $fields['message'],
];
$emailBody = implode("\n", $bodyLines);

$sent = send_mail(
    $config['email'],
    'New contact form submission',
    $emailBody,
    $fields['email'],
    $config['host'],
    $attachments
);

if (!$sent) {
    respond(500, ['message' => 'Unable to send message right now.']);
}

respond(200, ['message' => 'Message sent']);
