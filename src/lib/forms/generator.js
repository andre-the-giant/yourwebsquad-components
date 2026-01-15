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
  const fields = form.fields.map((field) => ({
    name: field.name,
    label: inferLabel(field),
    type: field.type,
    required: Boolean(field.required),
    maxLength: field.maxLength ?? null,
    minLength: field.minLength ?? null,
    pattern: field.pattern ?? null,
    sanitize: field.sanitize || "text",
    options:
      field.type === "select" || field.type === "radio"
        ? (field.options || []).map((opt) => ({
            value: String(opt.value),
            label: resolveLocalized(opt.label) || String(opt.value)
          }))
        : []
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

function build_mail_headers(array $config, array $values): string {
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
    $headers[] = 'Content-Type: text/plain; charset=UTF-8';
    return implode("\\r\\n", $headers);
}

$allowedHosts = ${allowedPhpArray};

function normalize_host(?string $value): string {
    $value = trim((string)$value);
    if ($value === '') return '';
    $parts = explode(':', $value);
    return strtolower($parts[0] ?? '');
}

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

$incomingNames = array_keys($_POST);
$unexpected = array_diff($incomingNames, $allowedNames);
if (!empty($unexpected)) {
    respond(400, ['ok' => false, 'message' => 'Unexpected fields supplied.']);
}

$honeypot = $config['security']['honeypot'] ?? null;
if ($honeypot && !empty(trim((string)($_POST[$honeypot] ?? '')))) {
    respond(200, ['ok' => true, 'message' => 'Message sent']);
}

$clean = [];
$errors = [];

foreach ($fields as $name => $meta) {
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

$headers = build_mail_headers($emailCfg, $clean);
$sent = @mail(implode(',', $recipients), $subject, $body, $headers);

if (!$sent) {
    respond(500, ['ok' => false, 'message' => 'Unable to send message right now.']);
}

respond(200, ['ok' => true, 'message' => 'Message sent']);
`;
}
