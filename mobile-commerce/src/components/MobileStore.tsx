'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { useMemo, useState } from 'react';

export type Product = { id: number; name: string; description: string; price: number; stock_quantity: number; image_url: string };
type Cart = { items: Array<{ product: Product; quantity: number; line_total: number }>; total_amount: number };

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
	const response = await fetch(`${apiUrl}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
	const payload = await response.json();
	if (!response.ok) throw new Error(payload.message || '요청을 처리하지 못했습니다.');
	return payload;
}

export function MobileStore({ products, kakaoReady }: { products: Product[]; kakaoReady: boolean }) {
	const { data: session } = useSession();
	const [demoToken, setDemoToken] = useState('');
	const [cart, setCart] = useState<Cart | null>(null);
	const [message, setMessage] = useState('');
	const [busyId, setBusyId] = useState<number | null>(null);
	const token = session?.apiToken || demoToken;
	const itemCount = useMemo(() => cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0, [cart]);

	async function demoLogin() {
		try {
			const payload = await api<{ token: string; user: { name: string } }>('/api/auth/kakao', { method: 'POST', body: JSON.stringify({ mode: 'demo' }) });
			setDemoToken(payload.token);
			setMessage(`${payload.user.name}으로 로그인했습니다.`);
			const cartPayload = await api<{ data: Cart }>('/api/cart', { headers: { Authorization: `Bearer ${payload.token}` } });
			setCart(cartPayload.data);
		} catch (error) {
			setMessage(error instanceof Error ? error.message : '로그인에 실패했습니다.');
		}
	}

	async function login() {
		if (kakaoReady) await signIn('kakao');
		else await demoLogin();
	}

	async function add(productId: number) {
		if (!token) {
			setMessage('먼저 카카오 데모 로그인을 실행하세요.');
			return;
		}
		setBusyId(productId);
		try {
			const payload = await api<{ data: Cart }>('/api/cart/items', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ product_id: productId, quantity: 1 }) });
			setCart(payload.data);
			setMessage('상품을 장바구니에 담았습니다.');
		} catch (error) {
			setMessage(error instanceof Error ? error.message : '장바구니 처리에 실패했습니다.');
		} finally {
			setBusyId(null);
		}
	}

	async function logout() {
		if (token) await api('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
		setDemoToken('');
		setCart(null);
		setMessage('로그아웃되었습니다.');
		if (session) await signOut({ redirect: false });
	}

	return <main className="phone">
		<section className="hero"><div className="mobile-nav"><span>NEODUSA / 新品</span><b>Cart {itemCount}</b></div><p className="mobile-kicker">MOBILE CROSS-BORDER SELECT</p><h1>Seoul taste,<br />China sourcing.</h1><p>카카오 인증 토큰으로 중앙 API의 상품과 장바구니를 함께 운영합니다.</p></section>
		<section className="content">
			{!kakaoReady ? <p className="notice"><strong>데모 인증 모드</strong><br />운영 키가 없으므로 API의 카카오 Mock 토큰을 발급합니다. 키를 설정하면 동일 버튼이 NextAuth Kakao Provider로 전환됩니다.</p> : null}
			{token ? <div className="session-row"><span>{session?.user?.name || '카카오 데모 고객'} 로그인 중</span><button onClick={logout}>로그아웃</button></div> : <button className="button kakao" onClick={login}>카카오로 계속하기</button>}
			{message ? <p className="mobile-message" role="status">{message}</p> : null}
			<div className="mobile-heading"><div><small>CURATED TODAY</small><h2>모바일 추천 상품</h2></div><span>{products.length} items</span></div>
			{products.map(product => <article className="card" key={product.id}><img src={product.image_url} alt={product.name} /><div><small>재고 {product.stock_quantity}개</small><strong>{product.name}</strong><p>{product.description}</p><div className="mobile-buy"><b>{product.price.toLocaleString('ko-KR')}원</b><button className="button" disabled={busyId === product.id} onClick={() => add(product.id)}>{busyId === product.id ? '담는 중' : '담기'}</button></div></div></article>)}
			{cart?.items.length ? <section className="mobile-cart"><h2>장바구니</h2>{cart.items.map(item => <div key={item.product.id}><span>{item.product.name} × {item.quantity}</span><b>{item.line_total.toLocaleString('ko-KR')}원</b></div>)}<footer><span>합계</span><strong>{cart.total_amount.toLocaleString('ko-KR')}원</strong></footer></section> : null}
		</section>
	</main>;
}
