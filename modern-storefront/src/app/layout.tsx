import type { Metadata } from 'next';
import './styles.css';
import { Providers } from '../components/Providers';

export const metadata: Metadata = {
	title: '어이사마켓 운영 데모',
	description: '한중 크로스보더 커머스 유지운영 포트폴리오',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="ko">
			<body>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
