import './styles.css';
import { SessionProviders } from '../components/SessionProviders';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body><SessionProviders>{children}</SessionProviders></body>
    </html>
  );
}
