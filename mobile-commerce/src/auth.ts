import NextAuth from 'next-auth';
import Kakao from 'next-auth/providers/kakao';

const apiUrl = process.env.API_INTERNAL_URL || 'http://api-server:8000';

export const { handlers, auth } = NextAuth({
	providers: [
		Kakao({
			clientId: process.env.KAKAO_CLIENT_ID || 'demo-client-id',
			clientSecret: process.env.KAKAO_CLIENT_SECRET || 'demo-client-secret',
		}),
	],
	callbacks: {
		async jwt({ token, account }) {
			if (account?.provider === 'kakao' && account.access_token) {
				const response = await fetch(`${apiUrl}/api/auth/kakao`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ access_token: account.access_token }),
				});
				if (!response.ok) throw new Error('카카오 계정을 커머스 API와 연결하지 못했습니다.');
				const payload = await response.json();
				token.apiToken = payload.token;
			}
			return token;
		},
		async session({ session, token }) {
			session.apiToken = typeof token.apiToken === 'string' ? token.apiToken : undefined;
			return session;
		},
	},
	pages: { error: '/auth/error' },
});

declare module 'next-auth' {
	interface Session {
		apiToken?: string;
	}
}

declare module '@auth/core/jwt' {
	interface JWT {
		apiToken?: string;
	}
}
