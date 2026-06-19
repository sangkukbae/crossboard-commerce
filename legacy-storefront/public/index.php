<?php

declare(strict_types=1);

$apiUrl = getenv('API_URL') ?: 'http://localhost:8000';

?><!doctype html>
<html lang="ko">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>레거시 어이사마켓</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
    <style>
        body { background: #f4f6f1; }
        .navbar { background: #17202a; }
        .product-img { aspect-ratio: 4 / 3; object-fit: cover; width: 100%; }
        .legacy-note { border-left: 6px solid #0f766e; }
    </style>
</head>
<body>
<nav class="navbar navbar-dark navbar-expand-lg">
    <div class="container">
        <a class="navbar-brand fw-bold" href="/">어이사마켓 Legacy</a>
        <button id="open-cart" class="btn btn-warning btn-sm">Cart <span id="cart-count">0</span></button>
    </div>
</nav>

<main class="container py-4">
    <section class="bg-white p-4 rounded-2 shadow-sm legacy-note mb-4">
        <h1 class="h3 fw-bold">Blade + jQuery 유지보수 데모</h1>
        <p class="mb-0">동일 API를 Ajax로 호출하고, 로그인 토큰을 localStorage에 저장해 장바구니를 갱신합니다.</p>
    </section>

    <section class="row g-3 mb-4">
        <div class="col-md-8">
            <input id="keyword" class="form-control" placeholder="상품명 검색">
        </div>
        <div class="col-md-4 d-grid">
            <button id="search" class="btn btn-dark">검색</button>
        </div>
    </section>

    <div id="alert"></div>
    <section id="products" class="row g-3"></section>

    <section id="detail" class="bg-white border rounded-2 p-4 mt-4" style="display:none">
        <div class="d-flex justify-content-between align-items-start gap-3">
            <h2 class="h4 fw-bold mb-3">상품 상세</h2>
            <button id="close-detail" class="btn btn-sm btn-outline-secondary">닫기</button>
        </div>
        <div id="detail-content" class="row g-4"></div>
    </section>

    <section id="cart-panel" class="bg-dark text-white rounded-2 p-4 mt-4" style="display:none">
        <div class="d-flex justify-content-between align-items-start gap-3">
            <h2 class="h4 fw-bold">Ajax 장바구니</h2>
            <button id="close-cart" class="btn btn-sm btn-outline-light">닫기</button>
        </div>
        <div id="cart-items"></div>
        <div class="d-flex justify-content-between border-top pt-3 mt-3 fs-5"><span>합계</span><strong id="cart-total">0원</strong></div>
    </section>
</main>

<script>
const API_URL = <?= json_encode($apiUrl, JSON_UNESCAPED_SLASHES) ?>;

function token() {
  return localStorage.getItem('legacyToken') || 'demo-user-token';
}

function api(path, options = {}) {
  return $.ajax({
    url: API_URL + path,
    method: options.method || 'GET',
    data: options.data ? JSON.stringify(options.data) : undefined,
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token(), 'X-Requested-With': 'XMLHttpRequest' }
  });
}

function showAlert(message, type = 'danger') {
  $('#alert').html(`<div class="alert alert-${type}">${message}</div>`);
}

function loadProducts() {
  const keyword = $('#keyword').val();
  api('/api/products?keyword=' + encodeURIComponent(keyword)).done((payload) => {
    $('#products').html(payload.data.map((product) => `
      <article class="col-12 col-md-4">
        <div class="card h-100">
          <img class="product-img" src="${product.image_url}" alt="${product.name}">
          <div class="card-body">
            <h2 class="h5">${product.name}</h2>
            <p>${product.description}</p>
            <p class="fw-bold text-success">${product.price.toLocaleString('ko-KR')}원</p>
            ${product.stock_quantity < 10 ? `<p class="text-danger fw-bold">재고 부족 ${product.stock_quantity}개</p>` : ''}
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-secondary view-detail" data-id="${product.id}">상세 보기</button>
              <button class="btn btn-sm btn-dark add-cart" data-id="${product.id}">장바구니 담기</button>
            </div>
          </div>
        </div>
      </article>
    `).join(''));
  }).fail(() => showAlert('상품 목록을 불러오지 못했습니다.'));
}

function refreshCart() {
  api('/api/cart').done((payload) => {
    renderCart(payload.data);
  });
}

function renderCart(cart) {
  $('#cart-count').text(cart.items.reduce((sum, item) => sum + item.quantity, 0));
  $('#cart-total').text(cart.total_amount.toLocaleString('ko-KR') + '원');
  $('#cart-items').html(cart.items.length ? cart.items.map((item) => `
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 border-top py-3">
      <div><strong>${item.product.name}</strong><div class="text-white-50">${item.line_total.toLocaleString('ko-KR')}원</div></div>
      <div class="d-flex align-items-center gap-2">
        <button class="btn btn-sm btn-outline-light cart-quantity" data-id="${item.product.id}" data-quantity="${item.quantity - 1}" ${item.quantity <= 1 ? 'disabled' : ''}>−</button>
        <span class="px-2">${item.quantity}</span>
        <button class="btn btn-sm btn-outline-light cart-quantity" data-id="${item.product.id}" data-quantity="${item.quantity + 1}">+</button>
        <button class="btn btn-sm btn-danger cart-delete" data-id="${item.product.id}">삭제</button>
      </div>
    </div>`).join('') : '<p class="text-white-50 mt-3">장바구니가 비어 있습니다.</p>');
}

$(document).on('click', '.add-cart', function () {
  api('/api/cart/items', { method: 'POST', data: { product_id: Number($(this).data('id')), quantity: 1 } })
    .done(() => { showAlert('장바구니에 담았습니다.', 'success'); refreshCart(); })
    .fail((xhr) => {
      if (xhr.status === 401) location.href = '/login';
      showAlert(xhr.responseJSON?.message || '장바구니 처리 중 오류가 발생했습니다.');
    });
});

$(document).on('click', '.view-detail', function () {
  api('/api/products/' + $(this).data('id')).done((payload) => {
    const product = payload.data;
    $('#detail-content').html(`
      <div class="col-md-5"><img class="img-fluid rounded-2" src="${product.image_url}" alt="${product.name}"></div>
      <div class="col-md-7"><span class="badge text-bg-success mb-2">${product.source}</span><h3>${product.name}</h3><p>${product.description}</p><p class="fs-4 fw-bold text-success">${product.price.toLocaleString('ko-KR')}원</p><p>현재 재고 ${product.stock_quantity}개</p><button class="btn btn-dark add-cart" data-id="${product.id}">장바구니 담기</button></div>`);
    $('#detail').slideDown();
    document.querySelector('#detail').scrollIntoView({ behavior: 'smooth' });
  }).fail((xhr) => showAlert(xhr.responseJSON?.message || '상품 상세를 불러오지 못했습니다.'));
});

$(document).on('click', '.cart-quantity', function () {
  api('/api/cart/items/' + $(this).data('id'), { method: 'PATCH', data: { quantity: Number($(this).data('quantity')) } })
    .done((payload) => renderCart(payload.data))
    .fail((xhr) => showAlert(xhr.responseJSON?.message || '수량을 변경하지 못했습니다.'));
});

$(document).on('click', '.cart-delete', function () {
  api('/api/cart/items/' + $(this).data('id'), { method: 'DELETE' })
    .done((payload) => renderCart(payload.data))
    .fail((xhr) => showAlert(xhr.responseJSON?.message || '상품을 삭제하지 못했습니다.'));
});

$('#search').on('click', loadProducts);
$('#keyword').on('keydown', (event) => { if (event.key === 'Enter') loadProducts(); });
$('#open-cart').on('click', () => { refreshCart(); $('#cart-panel').slideDown(); document.querySelector('#cart-panel').scrollIntoView({ behavior: 'smooth' }); });
$('#close-cart').on('click', () => $('#cart-panel').slideUp());
$('#close-detail').on('click', () => $('#detail').slideUp());
loadProducts();
refreshCart();
</script>
</body>
</html>
