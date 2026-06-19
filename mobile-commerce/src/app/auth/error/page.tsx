export default function AuthErrorPage() {
	return <main className="phone"><section className="hero"><p className="mobile-kicker">AUTH ERROR</p><h1>로그인 연결 실패</h1></section><section className="content"><p className="notice">카카오 인증을 완료하지 못했습니다. OAuth 키와 Redirect URI를 확인한 뒤 다시 시도하세요.</p><a className="button" href="/">상품 화면으로 돌아가기</a></section></main>;
}
