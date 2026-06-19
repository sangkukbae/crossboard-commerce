import { MobileStore, type Product } from '../components/MobileStore';

export const dynamic = 'force-dynamic';

const apiUrl = process.env.API_INTERNAL_URL || 'http://api-server:8000';

export default async function MobileHome() {
	const kakaoReady = Boolean(process.env.KAKAO_CLIENT_ID && process.env.KAKAO_CLIENT_SECRET);
	let products: Product[] = [];
	try {
		const response = await fetch(`${apiUrl}/api/products?per_page=6`, {
			cache: 'no-store',
			signal: AbortSignal.timeout(3_000),
		});
		const payload = await response.json();
		products = payload.data ?? [];
	} catch (error) {
		console.error('[모바일 상품] 중앙 API 연결 실패', error);
	}
	return <MobileStore products={products} kakaoReady={kakaoReady} />;
}
