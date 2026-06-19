# API Server

Laravel 9 운영 포지션의 API 표면을 빠르게 시연하기 위한 PHP 8.2 데모 서버입니다.

- 인증: `POST /api/auth/login`
- 상품: `GET /api/products`, `GET /api/products/{id}`
- 장바구니: `GET|POST|PATCH|DELETE /api/cart`
- 주문/결제: `POST /api/orders/prepare`, `POST /api/payments/confirm`
- 관리자: `GET /api/admin/dashboard`, `GET /api/admin/orders`
- 1688 Mock: `GET /api/wholesale/search`, `POST /api/wholesale/import/{itemId}`

## 데모 계정

- 고객: `demo@uh2sa.test` / `password`
- 관리자: `admin@uh2sa.test` / `password`
