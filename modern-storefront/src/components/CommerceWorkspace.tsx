'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export type Product = {
	id: number;
	name: string;
	description: string;
	price: number;
	stock_quantity: number;
	image_url: string;
	category: string;
	source: string;
};

type Cart = {
	items: Array<{ product: Product; quantity: number; line_total: number }>;
	total_amount: number;
};

type Order = {
	id: number;
	order_number: string;
	total_amount: number;
	status: string;
	created_at: string;
};

type SalesRow = { date: string; sales: number };
type WholesaleItem = {
	item_id: string;
	name: string;
	category: string;
	cny_price: number;
	moq: number;
	krw_cost: number;
	sale_price: number;
	expected_margin: number;
};

type AdminSnapshot = {
	dashboard: {
		today_order_count: number;
		today_sales: number;
		low_stock_products: Product[];
	};
	sales: SalesRow[];
	orders: Order[];
};

const statusLabel: Record<string, string> = {
	paid: '결제 완료',
	preparing: '배송 준비',
	shipping: '배송 중',
	completed: '완료',
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
	const response = await fetch(`${apiUrl}${path}`, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...(options.headers || {}),
		},
	});
	const payload = await response.json();
	if (!response.ok) {
		throw new Error(payload.message || 'API 요청에 실패했습니다.');
	}
	return payload;
}

function authorization(token: string) {
	return { Authorization: `Bearer ${token}` };
}

export function CommerceWorkspace({
	initialProducts,
}: {
	initialProducts: Product[];
}) {
	const queryClient = useQueryClient();
	const [products, setProducts] = useState(initialProducts);
	const [userToken, setUserToken] = useState('');
	const [adminToken, setAdminToken] = useState('');
	const [selectedProductId, setSelectedProductId] = useState<number | null>(
		null,
	);
	const [toast, setToast] = useState('');
	const [admin, setAdmin] = useState<AdminSnapshot | null>(null);
	const [orderStatus, setOrderStatus] = useState('');
	const [wholesaleKeyword, setWholesaleKeyword] = useState('광저우');
	const [wholesaleCategory, setWholesaleCategory] = useState('');
	const [wholesaleItems, setWholesaleItems] = useState<WholesaleItem[]>([]);

	async function login(role: 'user' | 'admin') {
		if (role === 'user' && userToken) return userToken;
		if (role === 'admin' && adminToken) return adminToken;
		const email = role === 'admin' ? 'admin@uh2sa.test' : 'demo@uh2sa.test';
		const payload = await request<{ token: string }>('/api/auth/login', {
			method: 'POST',
			body: JSON.stringify({ email, password: 'password' }),
		});
		if (role === 'admin') setAdminToken(payload.token);
		else setUserToken(payload.token);
		return payload.token;
	}

	const cartQuery = useQuery({
		queryKey: ['cart', userToken],
		enabled: Boolean(userToken),
		queryFn: async () => {
			const payload = await request<{ data: Cart }>('/api/cart', {
				headers: authorization(userToken),
			});
			return payload.data;
		},
	});

	const recommendations = useQuery({
		queryKey: ['recommendations', selectedProductId],
		enabled: selectedProductId !== null,
		queryFn: async () => {
			const payload = await request<{
				data: Array<{ product: Product; score: number }>;
				meta: { source: string };
			}>(`/api/products/${selectedProductId}/recommendations`);
			return payload;
		},
	});

	const addCart = useMutation({
		mutationFn: async ({
			product,
			token,
		}: {
			product: Product;
			token: string;
		}) => {
			const payload = await request<{ data: Cart }>('/api/cart/items', {
				method: 'POST',
				headers: authorization(token),
				body: JSON.stringify({ product_id: product.id, quantity: 1 }),
			});
			return payload.data;
		},
		onMutate: async ({ product, token }) => {
			const key = ['cart', token];
			await queryClient.cancelQueries({ queryKey: key });
			const previous = queryClient.getQueryData<Cart>(key);
			const current = previous ?? { items: [], total_amount: 0 };
			const exists = current.items.find(item => item.product.id === product.id);
			const items = exists
				? current.items.map(item =>
						item.product.id === product.id
							? {
									...item,
									quantity: item.quantity + 1,
									line_total: item.line_total + product.price,
								}
							: item,
					)
				: [
						...current.items,
						{ product, quantity: 1, line_total: product.price },
					];
			queryClient.setQueryData<Cart>(key, {
				items,
				total_amount: current.total_amount + product.price,
			});
			return { previous, key };
		},
		onError: (error, _variables, context) => {
			if (context?.previous)
				queryClient.setQueryData(context.key, context.previous);
			setToast(
				error instanceof Error
					? error.message
					: '장바구니를 이전 상태로 복구했습니다.',
			);
		},
		onSuccess: (cart, variables) => {
			queryClient.setQueryData(['cart', variables.token], cart);
			setToast('장바구니에 담았습니다.');
		},
	});

	const updateCart = useMutation({
		mutationFn: async ({
			productId,
			quantity,
			token,
		}: {
			productId: number;
			quantity: number;
			token: string;
		}) => {
			const payload = await request<{ data: Cart }>(
				`/api/cart/items/${productId}`,
				{
					method: 'PATCH',
					headers: authorization(token),
					body: JSON.stringify({ quantity }),
				},
			);
			return { cart: payload.data, token };
		},
		onSuccess: ({ cart, token }) =>
			queryClient.setQueryData(['cart', token], cart),
		onError: error =>
			setToast(
				error instanceof Error ? error.message : '수량 변경에 실패했습니다.',
			),
	});

	const deleteCart = useMutation({
		mutationFn: async ({
			productId,
			token,
		}: {
			productId: number;
			token: string;
		}) => {
			const payload = await request<{ data: Cart }>(
				`/api/cart/items/${productId}`,
				{
					method: 'DELETE',
					headers: authorization(token),
				},
			);
			return { cart: payload.data, token };
		},
		onSuccess: ({ cart, token }) =>
			queryClient.setQueryData(['cart', token], cart),
	});

	const checkout = useMutation({
		mutationFn: async () => {
			const token = await login('user');
			const prepared = await request<{ orderId: string; amount: number }>(
				'/api/orders/prepare',
				{
					method: 'POST',
					headers: authorization(token),
				},
			);
			return request<{ data: Order; message: string }>(
				'/api/payments/confirm',
				{
					method: 'POST',
					headers: authorization(token),
					body: JSON.stringify({
						paymentKey: 'portfolio-test-payment',
						...prepared,
					}),
				},
			);
		},
		onSuccess: payload => {
			queryClient.invalidateQueries({ queryKey: ['cart'] });
			setToast(`${payload.data.order_number} 결제가 승인되었습니다.`);
		},
		onError: error =>
			setToast(
				error instanceof Error ? error.message : '결제 처리에 실패했습니다.',
			),
	});

	async function fetchAdmin(status = orderStatus) {
		const token = await login('admin');
		const now = new Date();
		const fromDate = new Date(now);
		fromDate.setDate(now.getDate() - 6);
		const from = fromDate.toISOString().slice(0, 10);
		const to = now.toISOString().slice(0, 10);
		const [dashboard, sales, orders] = await Promise.all([
			request<{ data: AdminSnapshot['dashboard'] }>('/api/admin/dashboard', {
				headers: authorization(token),
			}),
			request<{ data: SalesRow[] }>(`/api/admin/sales?from=${from}&to=${to}`, {
				headers: authorization(token),
			}),
			request<{ data: Order[] }>(
				`/api/admin/orders?per_page=10&status=${status}`,
				{ headers: authorization(token) },
			),
		]);
		setAdmin({
			dashboard: dashboard.data,
			sales: sales.data,
			orders: orders.data,
		});
		return token;
	}

	const loadAdmin = useMutation({
		mutationFn: () => fetchAdmin(),
		onError: error =>
			setToast(
				error instanceof Error
					? error.message
					: '운영 데이터를 불러오지 못했습니다.',
			),
	});

	const changeOrderStatus = useMutation({
		mutationFn: async ({
			orderId,
			status,
		}: {
			orderId: number;
			status: string;
		}) => {
			const token = await login('admin');
			await request(`/api/admin/orders/${orderId}/status`, {
				method: 'PATCH',
				headers: authorization(token),
				body: JSON.stringify({ status }),
			});
		},
		onSuccess: () => {
			setToast('주문 상태와 변경 이력을 저장했습니다.');
			fetchAdmin();
		},
	});

	const searchWholesale = useMutation({
		mutationFn: async () => {
			const token = await login('admin');
			const query = new URLSearchParams({
				keyword: wholesaleKeyword,
				category: wholesaleCategory,
			});
			const payload = await request<{ data: WholesaleItem[] }>(
				`/api/wholesale/search?${query}`,
				{ headers: authorization(token) },
			);
			return payload.data;
		},
		onSuccess: setWholesaleItems,
		onError: error =>
			setToast(
				error instanceof Error ? error.message : '도매 검색에 실패했습니다.',
			),
	});

	const importWholesale = useMutation({
		mutationFn: async (itemId: string) => {
			const token = await login('admin');
			return request<{
				message: string;
				data: WholesaleItem & { product: Product };
			}>(`/api/wholesale/import/${itemId}`, {
				method: 'POST',
				headers: authorization(token),
			});
		},
		onSuccess: payload => {
			setToast(payload.message);
			setProducts(current =>
				current.some(product => product.id === payload.data.product.id)
					? current
					: [...current, payload.data.product],
			);
		},
	});

	const maxSales = useMemo(
		() => Math.max(1, ...(admin?.sales.map(row => row.sales) ?? [1])),
		[admin],
	);
	const cart = cartQuery.data;

	async function handleAdd(product: Product) {
		try {
			const token = await login('user');
			addCart.mutate({ product, token });
		} catch (error) {
			setToast(
				error instanceof Error ? error.message : '로그인에 실패했습니다.',
			);
		}
	}

	return (
		<>
			{toast ? (
				<div className="toast" role="status">
					<span>{toast}</span>
					<button onClick={() => setToast('')} aria-label="알림 닫기">
						×
					</button>
				</div>
			) : null}

			<section id="products" className="section">
				<div className="section-title">
					<div>
						<span className="eyebrow">CUSTOMER FLOW</span>
						<h2>상품 조회와 ML 추천</h2>
					</div>
				</div>
				<div className="product-grid">
					{products.map(product => (
						<article className="product-card" key={product.id}>
							<img alt={product.name} src={product.image_url} />
							<div>
								<p className="source-label">
									{product.source === 'wholesale_1688'
										? '1688 SOURCING'
										: 'DIRECT'}
								</p>
								<h3>{product.name}</h3>
								<p>{product.description}</p>
								<p className="price">
									{product.price.toLocaleString('ko-KR')}원
								</p>
								{product.stock_quantity < 10 ? (
									<p className="low-stock">
										재고 부족 {product.stock_quantity}개
									</p>
								) : (
									<p className="stock">재고 {product.stock_quantity}개</p>
								)}
								<div className="button-row">
									<button
										onClick={() => handleAdd(product)}
										disabled={addCart.isPending}
									>
										장바구니 담기
									</button>
									<button
										className="secondary"
										onClick={() => setSelectedProductId(product.id)}
									>
										유사 상품 보기
									</button>
								</div>
							</div>
						</article>
					))}
				</div>
				{selectedProductId !== null ? (
					<div className="recommendation-panel">
						<div className="section-title">
							<h3>유사 상품 추천</h3>
							<button
								className="text-button"
								onClick={() => setSelectedProductId(null)}
							>
								닫기
							</button>
						</div>
						{recommendations.isLoading ? (
							<p>추천 인덱스를 조회하고 있습니다.</p>
						) : null}
						{recommendations.data?.data.length === 0 ? (
							<p>현재 표시할 추천 상품이 없습니다.</p>
						) : null}
						<div className="recommendation-list">
							{recommendations.data?.data.map(row => (
								<div className="recommendation-item" key={row.product.id}>
									<img src={row.product.image_url} alt="" />
									<span>
										<strong>{row.product.name}</strong>
										<small>유사도 {(row.score * 100).toFixed(1)}%</small>
									</span>
								</div>
							))}
						</div>
						{recommendations.data ? (
							<small>응답 출처: {recommendations.data.meta.source}</small>
						) : null}
					</div>
				) : null}
			</section>

			<section id="checkout" className="section">
				<div className="section-title">
					<div>
						<span className="eyebrow">ORDER FLOW</span>
						<h2>장바구니와 결제</h2>
					</div>
				</div>
				<div className="admin-grid">
					<div className="panel">
						<h3>현재 장바구니</h3>
						{!userToken ? (
							<p>상품을 담으면 데모 고객으로 자동 로그인합니다.</p>
						) : null}
						{userToken && cartQuery.isLoading ? (
							<p>장바구니를 불러오는 중입니다.</p>
						) : null}
						{cart?.items.length === 0 ? (
							<p className="empty">장바구니가 비어 있습니다.</p>
						) : null}
						{cart?.items.map(item => (
							<div className="cart-row" key={item.product.id}>
								<span>
									<strong>{item.product.name}</strong>
									<small>{item.line_total.toLocaleString('ko-KR')}원</small>
								</span>
								<div className="quantity">
									<button
										onClick={() =>
											updateCart.mutate({
												productId: item.product.id,
												quantity: item.quantity - 1,
												token: userToken,
											})
										}
										disabled={item.quantity <= 1}
									>
										−
									</button>
									<b>{item.quantity}</b>
									<button
										onClick={() =>
											updateCart.mutate({
												productId: item.product.id,
												quantity: item.quantity + 1,
												token: userToken,
											})
										}
									>
										+
									</button>
								</div>
								<button
									className="danger-button"
									onClick={() =>
										deleteCart.mutate({
											productId: item.product.id,
											token: userToken,
										})
									}
								>
									삭제
								</button>
							</div>
						))}
						<div className="cart-total">
							<span>결제 예정 금액</span>
							<strong>
								{(cart?.total_amount ?? 0).toLocaleString('ko-KR')}원
							</strong>
						</div>
					</div>
					<div className="panel payment-panel">
						<span className="stamp">TOSS TEST MODE</span>
						<h3>결제 승인 실행</h3>
						<p>
							주문번호와 서버 계산 금액을 발급받은 후 테스트 결제를 승인합니다.
						</p>
						<button
							className="wide-button secondary"
							disabled={!cart?.items.length || checkout.isPending}
							onClick={() => checkout.mutate()}
						>
							{checkout.isPending ? '승인 처리 중' : '테스트 결제 승인'}
						</button>
					</div>
				</div>
			</section>

			<section id="admin" className="section">
				<div className="section-title">
					<div>
						<span className="eyebrow">OPERATIONS</span>
						<h2>관리자 대시보드</h2>
					</div>
					<button
						onClick={() => loadAdmin.mutate()}
						disabled={loadAdmin.isPending}
					>
						{loadAdmin.isPending
							? '불러오는 중'
							: admin
								? '운영 데이터 새로고침'
								: '운영 데이터 불러오기'}
					</button>
				</div>
				{admin ? (
					<>
						<div className="ops-summary">
							<div>
								<small>오늘 주문</small>
								<strong>{admin.dashboard.today_order_count}건</strong>
							</div>
							<div>
								<small>오늘 매출</small>
								<strong>
									{admin.dashboard.today_sales.toLocaleString('ko-KR')}원
								</strong>
							</div>
							<div>
								<small>재고 경고</small>
								<strong>{admin.dashboard.low_stock_products.length}건</strong>
							</div>
						</div>
						<div className="admin-grid">
							<div className="panel">
								<h3>최근 7일 매출</h3>
								<div className="bars" aria-label="최근 7일 매출 차트">
									{admin.sales.map(row => (
										<div className="bar-column" key={row.date}>
											<div
												className="bar"
												style={{
													height: `${Math.max(8, (row.sales / maxSales) * 130)}px`,
												}}
												title={`${row.date}: ${row.sales.toLocaleString('ko-KR')}원`}
											/>
											<small>{row.date.slice(5)}</small>
										</div>
									))}
								</div>
							</div>
							<div className="panel">
								<h3>재고 부족 상품</h3>
								{admin.dashboard.low_stock_products.map(product => (
									<div className="stock-alert" key={product.id}>
										<span>{product.name}</span>
										<strong>{product.stock_quantity}개</strong>
									</div>
								))}
							</div>
						</div>
						<div className="panel order-panel">
							<div className="section-title">
								<h3>주문 상태 관리</h3>
								<select
									value={orderStatus}
									onChange={event => {
										const status = event.target.value;
										setOrderStatus(status);
										fetchAdmin(status);
									}}
								>
									<option value="">전체 상태</option>
									{Object.entries(statusLabel).map(([value, label]) => (
										<option value={value} key={value}>
											{label}
										</option>
									))}
								</select>
							</div>
							{admin.orders.length === 0 ? (
								<p className="empty">조건에 맞는 주문이 없습니다.</p>
							) : (
								admin.orders.map(order => (
									<div className="order-row" key={order.id}>
										<span>
											<strong>{order.order_number}</strong>
											<small>
												{order.total_amount.toLocaleString('ko-KR')}원
											</small>
										</span>
										<span className="tag">
											{statusLabel[order.status] ?? order.status}
										</span>
										<select
											aria-label={`${order.order_number} 상태 변경`}
											value={order.status}
											onChange={event =>
												changeOrderStatus.mutate({
													orderId: order.id,
													status: event.target.value,
												})
											}
										>
											{Object.entries(statusLabel).map(([value, label]) => (
												<option value={value} key={value}>
													{label}
												</option>
											))}
										</select>
									</div>
								))
							)}
						</div>
					</>
				) : (
					<div className="panel empty-state">
						<strong>관리자 API가 준비되어 있습니다.</strong>
						<p>버튼을 누르면 매출·주문·재고 데이터를 병렬로 조회합니다.</p>
					</div>
				)}
			</section>

			<section id="wholesale" className="section">
				<div className="section-title">
					<div>
						<span className="eyebrow">CHINA SOURCING</span>
						<h2>1688 도매 상품 가져오기</h2>
					</div>
					<span>¥ 원가 → ₩ 환산 → 마진 검토 → 상품 등록</span>
				</div>
				<div className="panel wholesale-panel">
					<div className="search-row">
						<label>
							검색어
							<input
								value={wholesaleKeyword}
								onChange={event => setWholesaleKeyword(event.target.value)}
							/>
						</label>
						<label>
							카테고리
							<select
								value={wholesaleCategory}
								onChange={event => setWholesaleCategory(event.target.value)}
							>
								<option value="">전체</option>
								<option value="fashion">패션</option>
								<option value="living">리빙</option>
								<option value="digital">디지털</option>
							</select>
						</label>
						<button
							onClick={() => searchWholesale.mutate()}
							disabled={searchWholesale.isPending}
						>
							{searchWholesale.isPending
								? '1688 응답 대기 중'
								: '도매 상품 검색'}
						</button>
					</div>
					{wholesaleItems.length === 0 ? (
						<p className="empty">
							검색 조건을 입력하고 실제 Mock API 결과를 확인하세요.
						</p>
					) : (
						<div className="wholesale-results">
							{wholesaleItems.map(item => (
								<article key={item.item_id}>
									<div>
										<small>
											{item.item_id} · MOQ {item.moq}
										</small>
										<h3>{item.name}</h3>
									</div>
									<dl>
										<div>
											<dt>CNY 원가</dt>
											<dd>¥{item.cny_price}</dd>
										</div>
										<div>
											<dt>KRW 원가</dt>
											<dd>{item.krw_cost.toLocaleString('ko-KR')}원</dd>
										</div>
										<div>
											<dt>예상 마진</dt>
											<dd>{item.expected_margin.toLocaleString('ko-KR')}원</dd>
										</div>
										<div>
											<dt>판매 예정가</dt>
											<dd>{item.sale_price.toLocaleString('ko-KR')}원</dd>
										</div>
									</dl>
									<button
										className="secondary"
										onClick={() => importWholesale.mutate(item.item_id)}
										disabled={importWholesale.isPending}
									>
										판매 상품으로 가져오기
									</button>
								</article>
							))}
						</div>
					)}
				</div>
			</section>
		</>
	);
}
