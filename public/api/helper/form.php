<?php
declare(strict_types=1);

function respond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

function config_error(): void
{
    respond(500, ['message' => 'Sorry the website has a configuration error. Please contact us by phone so we can fix this error immediately.']);
}

function normalize_host(?string $value): string
{
    $value = trim((string)$value);
    $parts = explode(':', $value);
    return strtolower($parts[0] ?? '');
}

function clean_string(?string $value): string
{
    $value = trim((string)$value);
    $value = str_replace(["\r", "\n"], ' ', $value);
    return strip_tags($value);
}

function read_json(string $path): array
{
    if (!is_file($path)) {
        return [];
    }
    $data = json_decode((string)file_get_contents($path), true);
    return is_array($data) ? $data : [];
}

function load_company_config(): array
{
    $base = dirname(__DIR__, 2) . '/cms-content';

    $companyPath = realpath($base . '/company/company.json');
    $contactPath = realpath($base . '/company/contact.json');

    if (!$companyPath || !$contactPath) {
        config_error();
    }

    $companyData = read_json($companyPath);
    $contactData = read_json($contactPath);

    $companyUrl = trim((string)($companyData['url'] ?? ''));
    $companyHost = $companyUrl ? parse_url($companyUrl, PHP_URL_HOST) : '';
    $companyHost = normalize_host($companyHost);

    $companyEmailRaw = $contactData['email'] ?? '';
    $companyEmail = filter_var($companyEmailRaw, FILTER_VALIDATE_EMAIL) ?: '';

    if ($companyHost === '' || $companyEmail === '') {
        config_error();
    }

    return [
        'host' => $companyHost,
        'email' => $companyEmail,
    ];
}

function allowed_hosts(string $companyHost): array
{
    return array_values(array_unique(array_filter([$companyHost, 'localhost', '127.0.0.1'])));
}

function assert_origin(array $allowedHosts): void
{
    $host = normalize_host($_SERVER['HTTP_HOST'] ?? '');
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $originHost = $origin ? normalize_host(parse_url($origin, PHP_URL_HOST) ?: '') : '';

    if (!in_array($host, $allowedHosts, true) && (!$originHost || !in_array($originHost, $allowedHosts, true))) {
        respond(403, ['message' => 'Forbidden']);
    }
}

function rate_limit(string $key, int $limit = 5, int $windowSeconds = 900): bool
{
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
        // If we cannot persist, fail open to avoid blocking legitimate users.
        return true;
    }

    return $data['count'] <= $limit;
}

function send_mail(
    string $to,
    string $subject,
    string $body,
    string $replyTo,
    string $fromDomain,
    array $attachments = []
): bool
{
    $safeReply = filter_var($replyTo, FILTER_SANITIZE_EMAIL) ?: $replyTo;
    $headers = [
        'From' => "noreply@{$fromDomain}",
        'Reply-To' => $safeReply,
        'MIME-Version' => '1.0',
    ];

    if (empty($attachments)) {
        $headers['Content-Type'] = 'text/plain; charset=UTF-8';
        $headerString = '';
        foreach ($headers as $key => $value) {
            $headerString .= $key . ': ' . $value . "\r\n";
        }
        return @mail($to, $subject, $body, $headerString);
    }

    try {
        $boundary = '=_Part_' . bin2hex(random_bytes(12));
    } catch (Throwable $e) {
        $boundary = '=_Part_' . sha1(uniqid((string)mt_rand(), true));
    }

    $headers['Content-Type'] = 'multipart/mixed; boundary="' . $boundary . '"';
    $message = '--' . $boundary . "\r\n";
    $message .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $message .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
    $message .= $body . "\r\n\r\n";

    foreach ($attachments as $attachment) {
        $tmpName = (string)($attachment['tmp_name'] ?? '');
        $content = $tmpName !== '' ? @file_get_contents($tmpName) : false;
        if ($content === false) {
            continue;
        }

        $filename = basename((string)($attachment['name'] ?? 'upload.bin'));
        $filename = preg_replace('/[^a-zA-Z0-9._-]/', '_', $filename);
        $filename = $filename !== '' ? $filename : 'upload.bin';
        $mime = (string)($attachment['mime'] ?? 'application/octet-stream');

        $message .= '--' . $boundary . "\r\n";
        $message .= 'Content-Type: ' . $mime . '; name="' . $filename . "\"\r\n";
        $message .= 'Content-Disposition: attachment; filename="' . $filename . "\"\r\n";
        $message .= "Content-Transfer-Encoding: base64\r\n\r\n";
        $message .= chunk_split(base64_encode($content)) . "\r\n";
    }

    $message .= '--' . $boundary . '--';

    $headerString = '';
    foreach ($headers as $key => $value) {
        $headerString .= $key . ': ' . $value . "\r\n";
    }

    return @mail($to, $subject, $message, $headerString);
}
