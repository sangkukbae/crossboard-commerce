const apiUrl = process.env.API_URL ?? 'http://127.0.0.1:8000';
const mlUrl = process.env.ML_URL ?? 'http://127.0.0.1:8100';

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(10_000),
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`${response.status} ${url}: ${JSON.stringify(payload)}`);
  }
  return payload;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function verifyPage(name, url, marker) {
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  const html = await response.text();
  assert(response.ok, `${name} HTTP ${response.status}`);
  assert(html.includes(marker), `${name}에서 "${marker}" 문구를 찾지 못했습니다.`);
  console.log(`✓ ${name}: HTTP ${response.status}, ${html.length} bytes`);
}

const userHeaders = { Authorization: 'Bearer demo-user-token' };
const adminHeaders = { Authorization: 'Bearer demo-admin-token' };

const health = await request(`${apiUrl}/health`);
assert(health.status === 'ok', 'API health check 실패');
console.log('✓ API health');

const mlHealth = await request(`${mlUrl}/health`);
assert(mlHealth.status === 'ok' && mlHealth.index_size > 0, 'ML health check 실패');
console.log(`✓ ML health: ${mlHealth.model}, index ${mlHealth.index_size}`);

const login = await request(`${apiUrl}/api/auth/login`, {
  method: 'POST',
  body: JSON.stringify({ email: 'demo@uh2sa.test', password: 'password' }),
});
assert(login.token === 'demo-user-token', '고객 인증 실패');
console.log('✓ 고객 인증');

await request(`${apiUrl}/api/cart/items/3`, { method: 'DELETE', headers: userHeaders });
const cart = await request(`${apiUrl}/api/cart/items`, {
  method: 'POST',
  headers: userHeaders,
  body: JSON.stringify({ product_id: 3, quantity: 1 }),
});
assert(cart.data.total_amount === 16800, '장바구니 합계 불일치');
console.log('✓ 장바구니');

const prepared = await request(`${apiUrl}/api/orders/prepare`, { method: 'POST', headers: userHeaders });
assert(prepared.amount === 16800, '주문 준비 금액 불일치');
console.log(`✓ 주문 준비: ${prepared.orderId}`);

const payment = await request(`${apiUrl}/api/payments/confirm`, {
  method: 'POST',
  headers: userHeaders,
  body: JSON.stringify({ paymentKey: 'compose-verification', orderId: prepared.orderId, amount: prepared.amount }),
});
assert(payment.data.status === 'paid', '결제 승인 실패');
console.log(`✓ 결제 승인: order ${payment.data.id}`);

const dashboard = await request(`${apiUrl}/api/admin/dashboard`, { headers: adminHeaders });
assert(dashboard.data.today_order_count >= 1, '관리자 주문 집계 실패');
assert(dashboard.data.low_stock_products.length >= 1, '재고 부족 집계 실패');
console.log(`✓ 관리자 현황: 주문 ${dashboard.data.today_order_count}, 재고 경고 ${dashboard.data.low_stock_products.length}`);

const wholesale = await request(`${apiUrl}/api/wholesale/search?keyword=${encodeURIComponent('광저우')}`, { headers: adminHeaders });
assert(wholesale.data[0]?.sale_price > wholesale.data[0]?.krw_cost, '도매 가격 계산 실패');
console.log(`✓ 1688 Mock: ${wholesale.data[0].krw_cost}원 → ${wholesale.data[0].sale_price}원`);

const imported = await request(`${apiUrl}/api/wholesale/import/cn-8801`, { method: 'POST', headers: adminHeaders });
assert(imported.data.item_id === 'cn-8801', '도매 상품 가져오기 실패');
console.log('✓ 1688 상품 가져오기');

const importedProducts = await request(`${apiUrl}/api/products?keyword=${encodeURIComponent('광저우 여성용')}`);
assert(importedProducts.data.some((product) => product.source === 'wholesale_1688'), '가져온 상품이 판매 목록에 반영되지 않음');
console.log('✓ 가져온 상품 판매 목록 반영');

const updated = await request(`${apiUrl}/api/admin/orders/${payment.data.id}/status`, {
  method: 'PATCH',
  headers: adminHeaders,
  body: JSON.stringify({ status: 'preparing' }),
});
assert(updated.data.status === 'preparing', '주문 상태 변경 실패');
console.log('✓ 주문 상태 변경');

const recommendations = await request(`${mlUrl}/recommend`, {
  method: 'POST',
  body: JSON.stringify({ product_id: 1 }),
});
assert(recommendations.recommendations.length === 5, '추천 결과 개수 불일치');
console.log(`✓ ML 추천: ${recommendations.recommendations.length}건`);

const apiRecommendations = await request(`${apiUrl}/api/products/1/recommendations`);
assert(apiRecommendations.data.length > 0, 'API → ML 추천 연계 실패');
assert(['ml-service', 'cache'].includes(apiRecommendations.meta.source), '추천 응답 출처가 올바르지 않음');
console.log(`✓ API → ML 추천 연계: ${apiRecommendations.meta.source}`);

const sales = await request(`${apiUrl}/api/admin/sales`, { headers: adminHeaders });
const orders = await request(`${apiUrl}/api/admin/orders?per_page=5`, { headers: adminHeaders });
assert(sales.data.length === 7, '7일 매출 집계 실패');
assert(orders.meta.per_page === 5 && orders.data.length > 0, '관리자 주문 페이지네이션 실패');
console.log('✓ 관리자 매출·주문 조회');

await verifyPage('Modern Storefront', 'http://127.0.0.1:3000', '운영 데이터 불러오기');
await verifyPage('Mobile Commerce', 'http://127.0.0.1:3001', '데모 인증 모드');
await verifyPage('Legacy Storefront', 'http://127.0.0.1:8001', 'Ajax 장바구니');

console.log('\n전체 Compose 종단간 검증 통과');
