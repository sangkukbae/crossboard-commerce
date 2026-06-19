<?php

declare(strict_types=1);

date_default_timezone_set('Asia/Seoul');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$seedProducts = [
    ['id' => 1, 'name' => '서울 셀러 Pick 겨울 니트', 'description' => '1688 원단 소싱과 국내 검수를 거친 여성 니트입니다.', 'price' => 32900, 'stock_quantity' => 8, 'image_url' => 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80', 'category' => 'fashion', 'source' => 'direct'],
    ['id' => 2, 'name' => '광저우 데일리 크로스백', 'description' => '중국 도매가 기반으로 마진을 계산한 모바일 커머스 주력 상품입니다.', 'price' => 45900, 'stock_quantity' => 21, 'image_url' => 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=900&q=80', 'category' => 'fashion', 'source' => 'wholesale_1688'],
    ['id' => 3, 'name' => 'K-뷰티 저자극 클렌징 폼', 'description' => '한국 소비자 리뷰 키워드 기반 추천에 적합한 뷰티 상품입니다.', 'price' => 16800, 'stock_quantity' => 42, 'image_url' => 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80', 'category' => 'beauty', 'source' => 'direct'],
    ['id' => 4, 'name' => '상하이 무드 세라믹 머그', 'description' => 'MOQ와 CNY 원가를 운영자가 확인한 뒤 등록하는 라이프스타일 상품입니다.', 'price' => 12900, 'stock_quantity' => 5, 'image_url' => 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=80', 'category' => 'living', 'source' => 'wholesale_1688'],
    ['id' => 5, 'name' => '네오두사 모바일 단독 스니커즈', 'description' => '서브 브랜드 모바일 커머스에서 빠른 구매 전환을 시연하는 상품입니다.', 'price' => 69900, 'stock_quantity' => 14, 'image_url' => 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80', 'category' => 'shoes', 'source' => 'direct'],
    ['id' => 6, 'name' => '1688 소싱 미니 가습기', 'description' => '전기 생활용품 카테고리의 도매 검색, 가격 환산, 재고 운영 데모 상품입니다.', 'price' => 24900, 'stock_quantity' => 3, 'image_url' => 'https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?auto=format&fit=crop&w=900&q=80', 'category' => 'digital', 'source' => 'wholesale_1688'],
];

$users = [
    'demo@uh2sa.test' => ['id' => 1, 'name' => '데모 고객', 'email' => 'demo@uh2sa.test', 'password' => 'password', 'role' => 'user'],
    'admin@uh2sa.test' => ['id' => 9, 'name' => '운영 관리자', 'email' => 'admin@uh2sa.test', 'password' => 'password', 'role' => 'admin'],
];

$wholesale = [
    'cn-8801' => ['item_id' => 'cn-8801', 'name' => '광저우 여성용 크로스백', 'category' => 'fashion', 'cny_price' => 68.5, 'moq' => 20],
    'cn-8802' => ['item_id' => 'cn-8802', 'name' => '이우 세라믹 머그 세트', 'category' => 'living', 'cny_price' => 12.2, 'moq' => 100],
    'cn-8803' => ['item_id' => 'cn-8803', 'name' => '선전 USB 미니 가습기', 'category' => 'digital', 'cny_price' => 29.8, 'moq' => 50],
    'cn-8804' => ['item_id' => 'cn-8804', 'name' => '항저우 니트 베스트', 'category' => 'fashion', 'cny_price' => 41.0, 'moq' => 30],
];

$statePath = __DIR__ . '/../storage/state.json';
if (!is_dir(dirname($statePath))) {
    mkdir(dirname($statePath), 0777, true);
}
if (!file_exists($statePath)) {
    file_put_contents($statePath, json_encode([
        'carts' => [],
        'orders' => [
            ['id' => 1001, 'user_id' => 9, 'order_number' => 'UH2SA-20260619-001', 'total_amount' => 78800, 'status' => 'paid', 'payment_key' => 'demo_payment_001', 'items' => [['product_id' => 2, 'quantity' => 1, 'unit_price' => 45900], ['product_id' => 1, 'quantity' => 1, 'unit_price' => 32900]], 'created_at' => date('c')],
        ],
        'histories' => [],
        'imported' => [],
        'stock_overrides' => [],
        'recommendation_cache' => [],
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$state = json_decode((string) file_get_contents($statePath), true);
$state += ['carts' => [], 'orders' => [], 'histories' => [], 'imported' => [], 'stock_overrides' => [], 'recommendation_cache' => []];
$products = $seedProducts;
foreach ($state['imported'] as $imported) {
    if (isset($imported['product'])) {
        $products[] = $imported['product'];
    }
}
foreach ($products as &$product) {
    $override = $state['stock_overrides'][(string) $product['id']] ?? null;
    if ($override !== null) {
        $product['stock_quantity'] = (int) $override;
    }
}
unset($product);
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';

function respond(mixed $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function body(): array
{
    $raw = file_get_contents('php://input');
    return $raw ? (json_decode($raw, true) ?: []) : [];
}

function save_state(string $path, array $state): void
{
    file_put_contents($path, json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function token_user(array $users): ?array
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/Bearer\s+demo-(user|admin)-token/', $header, $matches)) {
        return null;
    }
    return $matches[1] === 'admin' ? $users['admin@uh2sa.test'] : $users['demo@uh2sa.test'];
}

function require_user(array $users): array
{
    $user = token_user($users);
    if (!$user) {
        respond(['error' => 'unauthenticated', 'message' => '로그인이 필요합니다.'], 401);
    }
    return $user;
}

function require_admin(array $users): array
{
    $user = require_user($users);
    if ($user['role'] !== 'admin') {
        respond(['error' => 'forbidden', 'message' => '관리자 권한이 필요합니다.'], 403);
    }
    return $user;
}

function find_product(array $products, int $id): ?array
{
    foreach ($products as $product) {
        if ($product['id'] === $id) {
            return $product;
        }
    }
    return null;
}

function cart_view(array $cart, array $products): array
{
    $items = [];
    $total = 0;
    foreach ($cart as $productId => $quantity) {
        $product = find_product($products, (int) $productId);
        if (!$product) {
            continue;
        }
        $lineTotal = $product['price'] * $quantity;
        $items[] = ['product' => $product, 'quantity' => $quantity, 'line_total' => $lineTotal];
        $total += $lineTotal;
    }
    return ['items' => $items, 'total_amount' => $total];
}

function priced_wholesale(array $item): array
{
    $exchangeRate = (float) ($_ENV['CNY_KRW_RATE'] ?? 190);
    $marginRate = (float) ($_ENV['MARGIN_RATE'] ?? 0.28);
    $krwCost = (int) round($item['cny_price'] * $exchangeRate);
    return $item + [
        'krw_cost' => $krwCost,
        'sale_price' => (int) round($krwCost * (1 + $marginRate)),
        'expected_margin' => (int) round($krwCost * $marginRate),
    ];
}

if ($path === '/health') {
    respond(['status' => 'ok', 'service' => 'api-server', 'stack' => 'PHP 8.2 / Laravel-style demo']);
}

if ($path === '/api/auth/login' && $method === 'POST') {
    $input = body();
    $user = $users[$input['email'] ?? ''] ?? null;
    if (!$user || $user['password'] !== ($input['password'] ?? '')) {
        respond(['error' => 'invalid_credentials', 'message' => '이메일 또는 비밀번호가 일치하지 않습니다.'], 401);
    }
    respond(['user' => array_diff_key($user, ['password' => true]), 'token' => $user['role'] === 'admin' ? 'demo-admin-token' : 'demo-user-token']);
}

if ($path === '/api/auth/kakao' && $method === 'POST') {
    respond(['user' => ['id' => 2, 'name' => '카카오 데모 고객', 'email' => 'kakao-demo@uh2sa.test', 'role' => 'user'], 'token' => 'demo-user-token', 'mode' => 'mock']);
}

if ($path === '/api/auth/logout' && $method === 'POST') {
    require_user($users);
    respond(['message' => '로그아웃되었습니다.']);
}

if ($path === '/api/products' && $method === 'GET') {
    $keyword = trim((string) ($_GET['keyword'] ?? ''));
    $category = trim((string) ($_GET['category'] ?? ''));
    $page = max(1, (int) ($_GET['page'] ?? 1));
    $perPage = min(100, max(1, (int) ($_GET['per_page'] ?? 20)));
    $filtered = array_values(array_filter($products, function (array $product) use ($keyword, $category): bool {
        if ($category !== '' && $product['category'] !== $category) {
            return false;
        }
        if ($keyword !== '' && strpos($product['name'] . ' ' . $product['description'], $keyword) === false) {
            return false;
        }
        return true;
    }));
    respond(['data' => array_slice($filtered, ($page - 1) * $perPage, $perPage), 'meta' => ['total' => count($filtered), 'current_page' => $page, 'per_page' => $perPage]]);
}

if (preg_match('#^/api/products/(\d+)$#', $path, $matches) && $method === 'GET') {
    $product = find_product($products, (int) $matches[1]);
    if (!$product) {
        respond(['error' => 'not_found', 'message' => '상품을 찾을 수 없습니다.'], 404);
    }
    respond(['data' => $product]);
}

if (preg_match('#^/api/products/(\d+)/recommendations$#', $path, $matches) && $method === 'GET') {
    $id = (int) $matches[1];
    if (!find_product($products, $id)) {
        respond(['error' => 'not_found', 'message' => '상품을 찾을 수 없습니다.'], 404);
    }
    $cacheKey = (string) $id;
    $cached = $state['recommendation_cache'][$cacheKey] ?? null;
    if ($cached && ($cached['expires_at'] ?? 0) > time()) {
        respond(['data' => $cached['data'], 'meta' => ['source' => 'cache']]);
    }

    $mlUrl = rtrim((string) ($_ENV['ML_SERVICE_URL'] ?? 'http://ml-service:8100'), '/');
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/json\r\n",
            'content' => json_encode(['product_id' => $id]),
            'timeout' => 3,
            'ignore_errors' => true,
        ],
    ]);
    $raw = @file_get_contents($mlUrl . '/recommend', false, $context);
    $payload = $raw ? json_decode($raw, true) : null;
    if (!is_array($payload) || !isset($payload['recommendations'])) {
        error_log(sprintf('[추천 서비스] 상품 %d 추천 조회 실패', $id));
        respond(['data' => [], 'meta' => ['source' => 'ml_error']]);
    }
    $rows = [];
    foreach ($payload['recommendations'] as $recommendation) {
        $recommended = find_product($products, (int) ($recommendation['product_id'] ?? 0));
        if ($recommended) {
            $rows[] = ['product' => $recommended, 'score' => round((float) ($recommendation['score'] ?? 0), 3)];
        }
    }
    $state['recommendation_cache'][$cacheKey] = ['expires_at' => time() + 3600, 'data' => $rows];
    save_state($statePath, $state);
    respond(['data' => $rows, 'meta' => ['source' => 'ml-service']]);
}

if ($path === '/api/cart' && $method === 'GET') {
    $user = require_user($users);
    respond(['data' => cart_view($state['carts'][(string) $user['id']] ?? [], $products)]);
}

if ($path === '/api/cart/items' && $method === 'POST') {
    $user = require_user($users);
    $input = body();
    $product = find_product($products, (int) ($input['product_id'] ?? 0));
    $quantity = (int) ($input['quantity'] ?? 1);
    if (!$product) {
        respond(['error' => 'not_found', 'message' => '상품을 찾을 수 없습니다.'], 404);
    }
    if ($quantity < 1 || $quantity > $product['stock_quantity']) {
        respond(['error' => 'invalid_quantity', 'message' => '재고가 부족합니다.'], 422);
    }
    $key = (string) $user['id'];
    $state['carts'][$key] ??= [];
    $current = (int) ($state['carts'][$key][(string) $product['id']] ?? 0);
    if ($current + $quantity > $product['stock_quantity']) {
        respond(['error' => 'invalid_quantity', 'message' => '재고가 부족합니다.'], 422);
    }
    $state['carts'][$key][(string) $product['id']] = $current + $quantity;
    save_state($statePath, $state);
    respond(['data' => cart_view($state['carts'][$key], $products)]);
}

if (preg_match('#^/api/cart/items/(\d+)$#', $path, $matches) && $method === 'PATCH') {
    $user = require_user($users);
    $input = body();
    $product = find_product($products, (int) $matches[1]);
    $quantity = (int) ($input['quantity'] ?? 1);
    if (!$product) {
        respond(['error' => 'not_found', 'message' => '상품을 찾을 수 없습니다.'], 404);
    }
    if ($quantity < 1 || $quantity > $product['stock_quantity']) {
        respond(['error' => 'invalid_quantity', 'message' => '요청 수량이 재고 범위를 벗어났습니다.'], 422);
    }
    $key = (string) $user['id'];
    $state['carts'][$key][(string) $product['id']] = $quantity;
    save_state($statePath, $state);
    respond(['data' => cart_view($state['carts'][$key], $products)]);
}

if (preg_match('#^/api/cart/items/(\d+)$#', $path, $matches) && $method === 'DELETE') {
    $user = require_user($users);
    $key = (string) $user['id'];
    unset($state['carts'][$key][(string) $matches[1]]);
    save_state($statePath, $state);
    respond(['data' => cart_view($state['carts'][$key] ?? [], $products)]);
}

if ($path === '/api/orders/prepare' && $method === 'POST') {
    $user = require_user($users);
    $cart = cart_view($state['carts'][(string) $user['id']] ?? [], $products);
    if (!$cart['items']) {
        respond(['error' => 'empty_cart', 'message' => '장바구니가 비어 있습니다.'], 422);
    }
    respond(['orderId' => 'UH2SA-' . date('Ymd-His'), 'amount' => $cart['total_amount']]);
}

if ($path === '/api/payments/confirm' && $method === 'POST') {
    $user = require_user($users);
    $input = body();
    $cart = cart_view($state['carts'][(string) $user['id']] ?? [], $products);
    if (!$cart['items']) {
        respond(['error' => 'empty_cart', 'message' => '결제할 상품이 없습니다.'], 422);
    }
    if ((int) ($input['amount'] ?? 0) !== $cart['total_amount']) {
        respond(['error' => 'payment_failed', 'message' => '결제 금액 검증에 실패했습니다.'], 402);
    }
    foreach ($cart['items'] as $item) {
        if ($item['quantity'] > $item['product']['stock_quantity']) {
            respond(['error' => 'out_of_stock', 'message' => '결제 처리 중 재고가 소진되었습니다.'], 422);
        }
    }
    $order = ['id' => count($state['orders']) + 1001, 'user_id' => $user['id'], 'order_number' => $input['orderId'] ?? ('UH2SA-' . time()), 'total_amount' => $cart['total_amount'], 'status' => 'paid', 'payment_key' => $input['paymentKey'] ?? 'mock-payment-key', 'items' => array_map(fn (array $item): array => ['product_id' => $item['product']['id'], 'quantity' => $item['quantity'], 'unit_price' => $item['product']['price']], $cart['items']), 'created_at' => date('c')];
    $state['orders'][] = $order;
    foreach ($cart['items'] as $item) {
        $state['stock_overrides'][(string) $item['product']['id']] = $item['product']['stock_quantity'] - $item['quantity'];
    }
    $state['carts'][(string) $user['id']] = [];
    save_state($statePath, $state);
    respond(['data' => $order, 'message' => '토스페이먼츠 테스트 결제가 승인되었습니다.']);
}

if ($path === '/api/orders' && $method === 'GET') {
    $user = require_user($users);
    respond(['data' => array_values(array_filter($state['orders'], fn (array $order): bool => $order['user_id'] === $user['id']))]);
}

if (preg_match('#^/api/orders/(\d+)$#', $path, $matches) && $method === 'GET') {
    $user = require_user($users);
    foreach ($state['orders'] as $order) {
        if ($order['id'] === (int) $matches[1]) {
            if ($order['user_id'] !== $user['id'] && $user['role'] !== 'admin') {
                respond(['error' => 'forbidden', 'message' => '다른 사용자의 주문은 조회할 수 없습니다.'], 403);
            }
            respond(['data' => $order]);
        }
    }
    respond(['error' => 'not_found', 'message' => '주문을 찾을 수 없습니다.'], 404);
}

if ($path === '/api/wholesale/search' && $method === 'GET') {
    require_admin($users);
    usleep(random_int(300000, 800000));
    $keyword = trim((string) ($_GET['keyword'] ?? ''));
    $category = trim((string) ($_GET['category'] ?? ''));
    $items = array_values(array_filter($wholesale, fn (array $item): bool => ($keyword === '' || strpos($item['name'], $keyword) !== false) && ($category === '' || $item['category'] === $category)));
    respond(['data' => array_map('priced_wholesale', array_slice($items, 0, 20))]);
}

if (preg_match('#^/api/wholesale/products/([^/]+)$#', $path, $matches) && $method === 'GET') {
    require_admin($users);
    if (!isset($wholesale[$matches[1]])) {
        respond(['error' => 'not_found', 'message' => '도매 상품을 찾을 수 없습니다.'], 404);
    }
    respond(['data' => priced_wholesale($wholesale[$matches[1]])]);
}

if (preg_match('#^/api/wholesale/import/([^/]+)$#', $path, $matches) && $method === 'POST') {
    require_admin($users);
    if (!isset($wholesale[$matches[1]])) {
        respond(['error' => 'not_found', 'message' => '도매 상품을 찾을 수 없습니다.'], 404);
    }
    foreach ($state['imported'] as $imported) {
        if (($imported['item_id'] ?? '') === $matches[1]) {
            respond(['data' => $imported, 'message' => '이미 가져온 도매 상품입니다.']);
        }
    }
    $priced = priced_wholesale($wholesale[$matches[1]]);
    $nextId = 100 + count($state['imported']) + 1;
    $priced['product'] = [
        'id' => $nextId,
        'name' => $priced['name'],
        'description' => sprintf('1688 %s 카테고리에서 가져온 MOQ %d개 상품입니다.', $priced['category'], $priced['moq']),
        'price' => $priced['sale_price'],
        'stock_quantity' => $priced['moq'],
        'image_url' => 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80',
        'category' => $priced['category'],
        'source' => 'wholesale_1688',
    ];
    $state['imported'][] = $priced;
    save_state($statePath, $state);
    respond(['data' => end($state['imported']), 'message' => '1688 상품을 판매 상품 후보로 가져왔습니다.']);
}

if ($path === '/api/admin/dashboard' && $method === 'GET') {
    require_admin($users);
    $today = date('Y-m-d');
    $todayOrders = array_values(array_filter($state['orders'], fn (array $order): bool => str_starts_with($order['created_at'], $today)));
    respond(['data' => [
        'today_order_count' => count($todayOrders),
        'today_sales' => array_sum(array_column($todayOrders, 'total_amount')),
        'low_stock_products' => array_values(array_filter($products, fn (array $product): bool => $product['stock_quantity'] < 10)),
        'recent_orders' => array_slice(array_reverse($state['orders']), 0, 10),
    ]]);
}

if ($path === '/api/admin/sales' && $method === 'GET') {
    require_admin($users);
    $from = $_GET['from'] ?? date('Y-m-d', strtotime('-6 days'));
    $to = $_GET['to'] ?? date('Y-m-d');
    if ($from > $to) {
        respond(['error' => 'invalid_date', 'message' => '시작일은 종료일보다 늦을 수 없습니다.'], 422);
    }
    $rows = [];
    for ($time = strtotime($from); $time <= strtotime($to); $time += 86400) {
        $date = date('Y-m-d', $time);
        $sales = array_sum(array_map(fn (array $order): int => str_starts_with($order['created_at'], $date) ? $order['total_amount'] : 0, $state['orders']));
        $rows[] = ['date' => $date, 'sales' => $sales];
    }
    respond(['data' => $rows]);
}

if ($path === '/api/admin/orders' && $method === 'GET') {
    require_admin($users);
    $status = $_GET['status'] ?? '';
    $orders = array_values(array_filter($state['orders'], fn (array $order): bool => $status === '' || $order['status'] === $status));
    $page = max(1, (int) ($_GET['page'] ?? 1));
    $perPage = min(20, max(1, (int) ($_GET['per_page'] ?? 10)));
    respond(['data' => array_slice(array_reverse($orders), ($page - 1) * $perPage, $perPage), 'meta' => ['total' => count($orders), 'current_page' => $page, 'per_page' => $perPage, 'last_page' => max(1, (int) ceil(count($orders) / $perPage))]]);
}

if (preg_match('#^/api/admin/orders/(\d+)/status$#', $path, $matches) && $method === 'PATCH') {
    $admin = require_admin($users);
    $input = body();
    $allowedStatuses = ['paid', 'preparing', 'shipping', 'completed'];
    if (!in_array($input['status'] ?? '', $allowedStatuses, true)) {
        respond(['error' => 'invalid_status', 'message' => '지원하지 않는 주문 상태입니다.'], 422);
    }
    foreach ($state['orders'] as &$order) {
        if ($order['id'] === (int) $matches[1]) {
            $from = $order['status'];
            $order['status'] = $input['status'] ?? $from;
            $state['histories'][] = ['order_id' => $order['id'], 'from_status' => $from, 'to_status' => $order['status'], 'changed_by' => $admin['id'], 'changed_at' => date('c')];
            save_state($statePath, $state);
            respond(['data' => $order, 'message' => '주문 상태가 변경되었습니다.']);
        }
    }
    respond(['error' => 'not_found', 'message' => '주문을 찾을 수 없습니다.'], 404);
}

respond(['error' => 'not_found', 'message' => '요청한 API 경로를 찾을 수 없습니다.', 'path' => $path], 404);
