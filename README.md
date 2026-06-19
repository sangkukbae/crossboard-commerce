# 한·중 크로스보더 커머스 운영 포트폴리오

한·중 커머스 풀스택 유지·운영 공고에 맞춘 수주형 MVP 데모입니다. 완전한 상용 구현보다, 기존 담당자 퇴사 후 바로 운영을 인수할 수 있음을 보여주는 핵심 흐름에 집중했습니다.

## Modern Storefront
<img width="457" height="777" alt="스크린샷 2026-06-19 16 24 53" src="https://github.com/user-attachments/assets/c4207141-6b90-467e-87e6-965afca932e0" />

## Legacy Storefront
<img width="745" height="759" alt="스크린샷 2026-06-19 16 26 08" src="https://github.com/user-attachments/assets/d9ebbd19-8d41-4b96-8140-00529004181e" />

## Mobil Commerce
<img width="161" height="766" alt="스크린샷 2026-06-19 16 25 29" src="https://github.com/user-attachments/assets/269d5626-77a7-43b3-846f-7c544045fd9a" />

## 빠른 실행

```bash
cp .env.example .env
docker compose up --build
```

전체 서비스 기동 후 종단간 스모크 테스트는 다음 명령으로 실행합니다.

```bash
node scripts/verify-compose.mjs
```

접속 포트:

- API Server: `http://localhost:8000/health`
- Modern Storefront: `http://localhost:3000`
- Legacy Storefront: `http://localhost:8001`
- Mobile Commerce: `http://localhost:3001`
- ML Service: `http://localhost:8100/health`

## 데모 계정

- 고객: `demo@uh2sa.test` / `password` / 토큰 `demo-user-token`
- 관리자: `admin@uh2sa.test` / `password` / 토큰 `demo-admin-token`

## 핵심 시나리오

1. Modern Storefront 상품 카드에서 장바구니와 유사 상품 버튼을 실행합니다.
2. 장바구니 수량을 변경하고 테스트 결제를 승인합니다.
3. 관리자 대시보드에서 실제 일별 매출, 재고 경고, 주문 상태를 조회·변경합니다.
4. 1688 검색 결과의 CNY 원가, KRW 환산가, 마진을 검토하고 판매 상품으로 가져옵니다.
5. Mobile Commerce에서 카카오 데모 로그인 후 동일 중앙 장바구니에 상품을 담습니다.
6. Legacy Storefront에서 jQuery Ajax 상품 상세와 장바구니 수량·삭제를 확인합니다.

## API 예시

```bash
curl -s http://localhost:8000/api/products

curl -s -X POST http://localhost:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@uh2sa.test","password":"password"}'

curl -s http://localhost:8000/api/admin/dashboard \
  -H 'Authorization: Bearer demo-admin-token'
```

## 구현 의도

- `api-server`: PHP 8.2 기반 Laravel-style API 표면. Sanctum 토큰, Cart, Order, Payment, Admin, Wholesale API를 데모 친화적으로 구현했습니다.
- `modern-storefront`: Next.js 14 App Router와 React Query로 SSR 상품, 낙관적 장바구니, 결제, ML 추천, 관리자, 도매 가져오기를 실제 API에 연결했습니다.
- `legacy-storefront`: PHP 템플릿, Bootstrap, jQuery Ajax로 상품 목록·상세·장바구니 수량 변경·삭제를 구현했습니다.
- `mobile-commerce`: Next.js 15/React 19/NextAuth v5 Kakao Provider 구조와 키 없는 데모 인증, 중앙 API 장바구니를 구현했습니다.
- `ml-service`: FastAPI 추천 API. Ko-SBERT/FAISS 설치가 무거운 환경을 고려해 deterministic fallback 임베딩을 기본 제공했습니다.

## 운영 확장 포인트

- PHP 데모 저장소를 Laravel 9 Eloquent/MySQL 마이그레이션으로 교체
- Redis Cart TTL, 추천 TTL 캐시 실제 적용
- Toss/Kakao 실 키 주입 후 외부 API 검증 활성화
- Sentry/Slack Webhook 환경 변수 설정 후 장애 알림 연결
- Supervisor/Deployer 배포 스크립트 추가
