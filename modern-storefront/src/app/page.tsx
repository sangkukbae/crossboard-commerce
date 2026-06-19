import {
	CommerceWorkspace,
	type Product,
} from '../components/CommerceWorkspace';

export const dynamic = 'force-dynamic';

const apiUrl =
	process.env.API_INTERNAL_URL ||
	process.env.NEXT_PUBLIC_API_URL ||
	'http://localhost:8000';

async function getProducts(): Promise<Product[]> {
	try {
		const response = await fetch(`${apiUrl}/api/products?per_page=100`, {
			cache: 'no-store',
			signal: AbortSignal.timeout(3_000),
		});
		if (!response.ok) throw new Error(`상품 API HTTP ${response.status}`);
		const payload = await response.json();
		return payload.data ?? [];
	} catch (error) {
		console.error('[상품 SSR] 상품 목록 조회 실패', error);
		return [];
	}
}

export default async function Home() {
	const products = await getProducts();
	const lowStock = products.filter(product => product.stock_quantity < 10);

	return (
		<main className="shell">
			<header className="topbar">
				<div className="brand">uh2samarket / Neodusa</div>
				<nav className="nav" aria-label="주요 메뉴">
					<a href="#products">상품·추천</a>
					<a href="#checkout">장바구니·결제</a>
					<a href="#admin">운영</a>
					<a href="#wholesale">1688</a>
				</nav>
			</header>

			<section className="hero">
				<div className="manifest">
					<p className="eyebrow">🇰🇷 ↔ 🇨🇳 COMMERCE PLATFORM</p>
					<h1>
						한·중 커머스
						<br />
						운영 인수 데모
					</h1>
					<p>
						상품 조회부터 결제 승인, 1688 소싱, ML 추천, 주문 상태 변경까지 모든
						버튼이 실제 컨테이너 API와 연결됩니다.
					</p>
				</div>
				<aside className="ops-board">
					<div className="board-title">
						<strong>운영 체크시트</strong>
						<span className="stamp">LIVE API</span>
					</div>
					<div className="kpi-grid">
						<div className="kpi">
							<strong>5</strong>
							<span>애플리케이션</span>
						</div>
						<div className="kpi">
							<strong>{products.length}</strong>
							<span>판매 상품</span>
						</div>
						<div className="kpi">
							<strong>{lowStock.length}</strong>
							<span>재고 경고</span>
						</div>
					</div>
					<p className="board-note">
						SSR 응답 시각 ·{' '}
						{new Intl.DateTimeFormat('ko-KR', {
							dateStyle: 'medium',
							timeStyle: 'short',
							timeZone: 'Asia/Seoul',
						}).format(new Date())}
					</p>
				</aside>
			</section>

			{products.length > 0 ? (
				<CommerceWorkspace initialProducts={products} />
			) : (
				<section className="section">
					<div className="panel error-state">
						<h2>상품 API에 연결할 수 없습니다.</h2>
						<p>API Server와 Docker 네트워크 상태를 확인하세요.</p>
					</div>
				</section>
			)}
		</main>
	);
}
