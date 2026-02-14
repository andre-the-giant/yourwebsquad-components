import { resolveLocalized } from "./schema.js";

function escapeForPhpString(str) {
  return str.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function normalizeEmailConfig(email, fields) {
  const to = Array.isArray(email.to) ? email.to : [email.to];
  const sanitizedTo = to.filter(Boolean);
  const replyToField =
    email.replyToField && fields.some((f) => f.name === email.replyToField)
      ? email.replyToField
      : null;

  return {
    to: sanitizedTo,
    from: email.from || null,
    replyToField,
    subject: resolveLocalized(email.subject),
    intro: resolveLocalized(email.intro)
  };
}

function inferLabel(field) {
  return resolveLocalized(field.label) || field.name;
}

export function buildFormConfig(form) {
  const defaultTelPattern = "^[0-9+()\\-\\s]{6,20}$";
  const fields = form.fields.map((field) => ({
    name: field.name,
    label: inferLabel(field),
    type: field.type,
    required: Boolean(field.required),
    maxLength: field.maxLength ?? null,
    minLength: field.minLength ?? null,
    pattern: field.pattern ?? (field.type === "tel" ? defaultTelPattern : null),
    sanitize: field.sanitize || "text",
    options:
      field.type === "select" || field.type === "radio"
        ? (field.options || []).map((opt) => ({
            value: String(opt.value),
            label: resolveLocalized(opt.label) || String(opt.value)
          }))
        : [],
    accept: field.type === "upload" ? field.accept || "image/*" : null,
    imagesOnly: field.type === "upload" ? field.imagesOnly !== false : null,
    multiple: field.type === "upload" ? Boolean(field.multiple) : false,
    maxFiles: field.type === "upload" ? (field.maxFiles ?? (field.multiple ? 5 : 1)) : null,
    maxFileSizeMb: field.type === "upload" ? (field.maxFileSizeMb ?? 5) : null
  }));

  const email = normalizeEmailConfig(form.email, fields);
  const honeypotEnabled = form.security?.honeypot?.enabled !== false;
  const honeypotName = honeypotEnabled ? form.security?.honeypot?.name || "middle_name" : null;

  return {
    id: form.id,
    endpoint: form.endpoint,
    fields,
    email,
    security: {
      honeypot: honeypotName,
      rateLimit: {
        max: form.security?.rateLimit?.max ?? 5,
        windowSeconds: form.security?.rateLimit?.windowSeconds ?? 60
      }
    }
  };
}

export function generatePhpEndpoint(form, { allowedOrigins = [] } = {}) {
  const config = buildFormConfig(form);
  const configJson = JSON.stringify(config);
  const configLiteral = escapeForPhpString(configJson);
  const allowed = Array.isArray(allowedOrigins) ? allowedOrigins.filter(Boolean) : [];
  const allowedPhpArray = allowed.length
    ? "['" + allowed.map((h) => escapeForPhpString(h)).join("','") + "']"
    : "[]";

  return `<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

function respond(int $status, array $payload): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function sanitize_value($value, string $mode) {
    if (is_array($value)) {
        return null;
    }
    $value = trim((string)$value);
    switch ($mode) {
        case 'email':
            return filter_var($value, FILTER_SANITIZE_EMAIL);
        case 'tel':
            return preg_replace('/[^0-9+()\\\\-\\\\s]/', '', $value);
        case 'number':
            return is_numeric($value) ? $value + 0 : null;
        case 'none':
            return $value;
        case 'text':
        default:
            $value = str_replace(["\\r", "\\n"], ' ', $value);
            return strip_tags($value);
    }
}

function pattern_to_regex(?string $pattern): ?string {
    if ($pattern === null || $pattern === '') return null;
    return '/' . str_replace('/', '\\\\/', $pattern) . '/u';
}

function rate_limit(string $key, int $limit, int $windowSeconds): bool {
    $store = sys_get_temp_dir() . '/form_rate_' . hash('sha256', $key);
    $now = time();
    $data = ['count' => 0, 'windowStart' => $now];

    if (is_file($store)) {
        $decoded = json_decode((string)file_get_contents($store), true);
        if (is_array($decoded) && isset($decoded['count'], $decoded['windowStart'])) {
            $data = $decoded;
        }
    }

    if ($now - $data['windowStart'] > $windowSeconds) {
        $data = ['count' => 0, 'windowStart' => $now];
    }

    $data['count']++;

    if (!@file_put_contents($store, json_encode($data), LOCK_EX)) {
        // Fail open if storage is unavailable.
        return true;
    }

    return $data['count'] <= $limit;
}

function interpolate(string $template, array $values): string {
    return preg_replace_callback('/\\\\$\\\\{([a-zA-Z0-9_]+)\\\\}/', function ($m) use ($values) {
        return isset($values[$m[1]]) ? (string)$values[$m[1]] : '';
    }, $template);
}

function normalize_host(?string $value): string {
    $value = trim((string)$value);
    if ($value === '') return '';
    $parts = explode(':', $value);
    return strtolower($parts[0] ?? '');
}

function clean_uploaded_name(string $name): string {
    $name = basename($name);
    $clean = preg_replace('/[^a-zA-Z0-9._-]/', '_', $name);
    return $clean !== '' ? $clean : 'upload.bin';
}

function upload_error_message(int $code): string {
    switch ($code) {
        case UPLOAD_ERR_INI_SIZE:
        case UPLOAD_ERR_FORM_SIZE:
            return 'File is too large.';
        case UPLOAD_ERR_PARTIAL:
            return 'File upload was interrupted.';
        case UPLOAD_ERR_NO_TMP_DIR:
        case UPLOAD_ERR_CANT_WRITE:
        case UPLOAD_ERR_EXTENSION:
            return 'Upload failed on server.';
        case UPLOAD_ERR_NO_FILE:
            return 'No file uploaded.';
        default:
            return 'Invalid file upload.';
    }
}

function flatten_files(?array $entry): array {
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

function file_extension(string $filename): string {
    $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    return $ext !== '' ? '.' . $ext : '';
}

function has_blocked_extension(string $filename): bool {
    $blocked = [
        '.php', '.phtml', '.php3', '.php4', '.php5', '.phar',
        '.pl', '.py', '.rb', '.cgi', '.asp', '.aspx', '.jsp',
        '.js', '.mjs', '.cjs', '.sh', '.bash', '.zsh', '.ps1',
        '.bat', '.cmd', '.com', '.exe', '.msi', '.dll', '.so', '.dylib',
        '.jar', '.vbs', '.wsf', '.hta', '.html', '.htm', '.xhtml',
        '.shtml', '.css', '.scss', '.sass', '.less', '.xml', '.svg'
    ];

    return in_array(file_extension($filename), $blocked, true);
}

function is_dangerous_mime(string $mime): bool {
    $mime = strtolower(trim($mime));
    if ($mime === '') return false;

    if (preg_match('/^text\\//i', $mime)) return true;
    if (preg_match('/^application\\/(javascript|x-javascript|ecmascript|x-httpd-php|x-php|x-sh|x-msdownload|x-dosexec|x-executable|x-bat|x-csh)/i', $mime)) return true;
    if (preg_match('/^application\\/html/i', $mime)) return true;
    if (preg_match('/^image\\/svg\\+xml/i', $mime)) return true;

    return false;
}

function is_image_extension(string $filename): bool {
    $allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff', '.tif', '.avif', '.heif', '.heic'];
    return in_array(file_extension($filename), $allowed, true);
}

function mime_matches_accept(string $mime, string $accept, string $filename): bool {
    $mime = strtolower(trim($mime));
    $accept = strtolower(trim($accept));
    $ext = file_extension($filename);
    $isImageExt = $ext !== '' && is_image_extension($filename);

    if ($accept === '') {
        if ($mime !== '') {
            return str_starts_with($mime, 'image/');
        }
        return $isImageExt;
    }

    $tokens = array_values(array_filter(array_map('trim', explode(',', $accept))));
    if (empty($tokens)) {
        if ($mime !== '') {
            return str_starts_with($mime, 'image/');
        }
        return $isImageExt;
    }

    foreach ($tokens as $token) {
        if ($token === '') {
            continue;
        }
        if (str_starts_with($token, '.')) {
            if ($ext !== '' && $ext === $token) {
                return true;
            }
            continue;
        }
        if (str_ends_with($token, '/*')) {
            $prefix = substr($token, 0, -1);
            if ($mime !== '' && str_starts_with($mime, $prefix)) {
                return true;
            }
            if ($prefix === 'image/' && $isImageExt) {
                return true;
            }
            continue;
        }
        if ($mime !== '' && $mime === $token) {
            return true;
        }
    }

    return false;
}

function parse_uploads(array $meta, ?array $entry, bool $required): array {
    $result = ['files' => [], 'error' => null];
    $files = flatten_files($entry);

    $present = array_values(array_filter($files, function ($file) {
        return (int)($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE;
    }));

    if ($required && empty($present)) {
        $result['error'] = 'This field is required.';
        return $result;
    }

    if (empty($present)) {
        return $result;
    }

    $multiple = (bool)($meta['multiple'] ?? false);
    $imagesOnly = array_key_exists('imagesOnly', $meta) ? (bool)$meta['imagesOnly'] : true;
    $maxFiles = (int)($meta['maxFiles'] ?? ($multiple ? 5 : 1));
    if ($maxFiles < 1) {
        $maxFiles = 1;
    }

    if (!$multiple && count($present) > 1) {
        $result['error'] = 'Only one file is allowed.';
        return $result;
    }

    if (count($present) > $maxFiles) {
        $result['error'] = 'Too many files uploaded.';
        return $result;
    }

    $maxFileSizeMb = (float)($meta['maxFileSizeMb'] ?? 5);
    if ($maxFileSizeMb <= 0) {
        $maxFileSizeMb = 5;
    }
    $maxBytes = (int)round($maxFileSizeMb * 1024 * 1024);

    $accept = (string)($meta['accept'] ?? 'image/*');
    $finfo = function_exists('finfo_open') ? finfo_open(FILEINFO_MIME_TYPE) : null;

    foreach ($present as $file) {
        $errCode = (int)($file['error'] ?? UPLOAD_ERR_NO_FILE);
        if ($errCode !== UPLOAD_ERR_OK) {
            if ($finfo) finfo_close($finfo);
            $result['error'] = upload_error_message($errCode);
            return $result;
        }

        $tmp = (string)($file['tmp_name'] ?? '');
        if ($tmp === '' || !is_uploaded_file($tmp)) {
            if ($finfo) finfo_close($finfo);
            $result['error'] = 'Invalid uploaded file.';
            return $result;
        }

        $size = (int)($file['size'] ?? 0);
        if ($size > $maxBytes) {
            if ($finfo) finfo_close($finfo);
            $result['error'] = 'File is too large.';
            return $result;
        }

        $filename = (string)($file['name'] ?? '');
        if (has_blocked_extension($filename)) {
            if ($finfo) finfo_close($finfo);
            $result['error'] = 'Blocked file extension.';
            return $result;
        }

        $providedType = (string)($file['type'] ?? '');
        $mime = $finfo ? (string)(finfo_file($finfo, $tmp) ?: $providedType) : $providedType;

        if (is_dangerous_mime($mime)) {
            if ($finfo) finfo_close($finfo);
            $result['error'] = 'Blocked file content type.';
            return $result;
        }

        if ($imagesOnly) {
            $isImageMime = str_starts_with(strtolower($mime), 'image/') && strtolower($mime) !== 'image/svg+xml';
            if (!$isImageMime && !is_image_extension($filename)) {
                if ($finfo) finfo_close($finfo);
                $result['error'] = 'Only image files are allowed.';
                return $result;
            }
        }

        if (!mime_matches_accept($mime, $accept, $filename)) {
            if ($finfo) finfo_close($finfo);
            $result['error'] = 'Invalid file type.';
            return $result;
        }

        $result['files'][] = [
            'name' => clean_uploaded_name($filename !== '' ? $filename : 'upload.bin'),
            'tmp_name' => $tmp,
            'mime' => $mime !== '' ? $mime : 'application/octet-stream',
            'size' => $size,
        ];
    }

    if ($finfo) finfo_close($finfo);
    return $result;
}

function build_mail_headers(array $config, array $values): array {
    $from = $config['from'] ?? '';
    $replyField = $config['replyToField'] ?? '';
    $replyTo = $replyField && isset($values[$replyField]) ? $values[$replyField] : '';

    $headers = [];
    if ($from) {
        $headers[] = 'From: ' . $from;
    }
    if ($replyTo) {
        $headers[] = 'Reply-To: ' . filter_var($replyTo, FILTER_SANITIZE_EMAIL);
    }
    $headers[] = 'MIME-Version: 1.0';
    return $headers;
}

function build_multipart_body(string $body, array $attachments, string $boundary): string {
    $eol = "\\r\\n";
    $message = '--' . $boundary . $eol;
    $message .= 'Content-Type: text/plain; charset=UTF-8' . $eol;
    $message .= 'Content-Transfer-Encoding: 8bit' . $eol . $eol;
    $message .= $body . $eol . $eol;

    foreach ($attachments as $attachment) {
        $content = @file_get_contents((string)$attachment['tmp_name']);
        if ($content === false) {
            continue;
        }

        $filename = str_replace('"', '', (string)($attachment['name'] ?? 'upload.bin'));
        $mime = (string)($attachment['mime'] ?? 'application/octet-stream');

        $message .= '--' . $boundary . $eol;
        $message .= 'Content-Type: ' . $mime . '; name="' . $filename . '"' . $eol;
        $message .= 'Content-Disposition: attachment; filename="' . $filename . '"' . $eol;
        $message .= 'Content-Transfer-Encoding: base64' . $eol . $eol;
        $message .= chunk_split(base64_encode($content)) . $eol;
    }

    $message .= '--' . $boundary . '--';
    return $message;
}

function send_form_mail(array $emailCfg, array $clean, array $recipients, string $subject, string $body, array $attachments): bool {
    $headers = build_mail_headers($emailCfg, $clean);

    if (empty($attachments)) {
        $headers[] = 'Content-Type: text/plain; charset=UTF-8';
        return @mail(implode(',', $recipients), $subject, $body, implode("\\r\\n", $headers));
    }

    try {
        $boundary = '=_Part_' . bin2hex(random_bytes(12));
    } catch (Throwable $e) {
        $boundary = '=_Part_' . sha1(uniqid((string)mt_rand(), true));
    }

    $headers[] = 'Content-Type: multipart/mixed; boundary="' . $boundary . '"';
    $message = build_multipart_body($body, $attachments, $boundary);
    return @mail(implode(',', $recipients), $subject, $message, implode("\\r\\n", $headers));
}

$allowedHosts = ${allowedPhpArray};

if (!empty($allowedHosts)) {
    $host = normalize_host($_SERVER['HTTP_HOST'] ?? '');
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $originHost = $origin ? normalize_host(parse_url($origin, PHP_URL_HOST) ?: '') : '';

    $allowed = array_map('normalize_host', $allowedHosts);
    if (($originHost && !in_array($originHost, $allowed, true)) || (!$originHost && $host && !in_array($host, $allowed, true))) {
        respond(403, ['ok' => false, 'message' => 'Forbidden']);
    }
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, ['ok' => false, 'message' => 'Method not allowed']);
}

$config = json_decode('${configLiteral}', true);
if (!is_array($config)) {
    respond(500, ['ok' => false, 'message' => 'Form configuration is invalid.']);
}

$fields = [];
foreach ($config['fields'] as $field) {
    $fields[$field['name']] = $field;
}

$allowedNames = array_keys($fields);
if (!empty($config['security']['honeypot'])) {
    $allowedNames[] = $config['security']['honeypot'];
}

$allowedIncoming = $allowedNames;
foreach ($allowedNames as $name) {
    $allowedIncoming[] = $name . '[]';
}

$incomingNames = array_unique(array_merge(array_keys($_POST), array_keys($_FILES)));
$unexpected = array_diff($incomingNames, $allowedIncoming);
if (!empty($unexpected)) {
    respond(400, ['ok' => false, 'message' => 'Unexpected fields supplied.']);
}

$honeypot = $config['security']['honeypot'] ?? null;
if ($honeypot && !empty(trim((string)($_POST[$honeypot] ?? '')))) {
    respond(200, ['ok' => true, 'message' => 'Message sent']);
}

$clean = [];
$errors = [];
$uploadsByField = [];

foreach ($fields as $name => $meta) {
    if (($meta['type'] ?? '') === 'upload') {
        $upload = parse_uploads($meta, $_FILES[$name] ?? null, (bool)($meta['required'] ?? false));
        if (!empty($upload['error'])) {
            $errors[$name] = $upload['error'];
            $clean[$name] = '';
            continue;
        }

        $files = $upload['files'] ?? [];
        $uploadsByField[$name] = $files;
        $clean[$name] = empty($files)
            ? ''
            : implode(', ', array_map(fn($f) => (string)$f['name'], $files));
        continue;
    }

    $raw = $_POST[$name] ?? '';
    if (is_array($raw)) {
        $errors[$name] = 'Invalid value.';
        continue;
    }

    $value = sanitize_value($raw, $meta['sanitize'] ?? 'text');
    $clean[$name] = $value;

    if (($meta['required'] ?? false) && ($value === null || $value === '')) {
        $errors[$name] = 'This field is required.';
        continue;
    }

    if ($meta['type'] === 'email' && $value !== '' && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
        $errors[$name] = 'Please enter a valid email.';
    }

    if ($meta['maxLength'] !== null && mb_strlen((string)$value) > (int)$meta['maxLength']) {
        $errors[$name] = 'Too long.';
    }

    if ($meta['minLength'] !== null && mb_strlen((string)$value) < (int)$meta['minLength']) {
        $errors[$name] = 'Too short.';
    }

    if (!empty($meta['pattern'])) {
        $regex = pattern_to_regex($meta['pattern']);
        if ($regex && !preg_match($regex, (string)$value)) {
            $errors[$name] = 'Invalid format.';
        }
    }

    if (($meta['type'] === 'select' || $meta['type'] === 'radio') && !empty($meta['options'])) {
        $allowedOpts = array_map(fn($opt) => (string)$opt['value'], $meta['options']);
        if ($value !== '' && !in_array((string)$value, $allowedOpts, true)) {
            $errors[$name] = 'Invalid selection.';
        }
    }
}

if (!empty($errors)) {
    respond(400, ['ok' => false, 'message' => 'Validation failed', 'errors' => $errors]);
}

$rateKey = $config['id'] . '|' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$limit = (int)($config['security']['rateLimit']['max'] ?? 5);
$window = (int)($config['security']['rateLimit']['windowSeconds'] ?? 60);
if (!rate_limit($rateKey, $limit, $window)) {
    respond(429, ['ok' => false, 'message' => 'Too many requests. Please try again later.']);
}

$emailCfg = $config['email'];
$recipients = array_filter($emailCfg['to']);
if (empty($recipients)) {
    respond(500, ['ok' => false, 'message' => 'Mail configuration error.']);
}

$subject = interpolate($emailCfg['subject'] ?? ('Form ' . $config['id']), $clean);

$lines = [];
if (!empty($emailCfg['intro'])) {
    $lines[] = $emailCfg['intro'];
    $lines[] = '';
}
foreach ($config['fields'] as $field) {
    $value = $clean[$field['name']] ?? '';
    $lines[] = ($field['label'] ?? $field['name']) . ': ' . ($value === '' ? '(blank)' : $value);
}
$body = implode("\\n", $lines);

$attachments = [];
foreach ($uploadsByField as $files) {
    foreach ($files as $file) {
        $attachments[] = $file;
    }
}

$sent = send_form_mail($emailCfg, $clean, $recipients, $subject, $body, $attachments);

if (!$sent) {
    respond(500, ['ok' => false, 'message' => 'Unable to send message right now.']);
}

respond(200, ['ok' => true, 'message' => 'Message sent']);
`;
}
