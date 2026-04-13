import Navbar from '@/components/Navbar';
import { AuthProvider } from '@/components/AuthProvider';
import '@/styles/globals.css';

export const metadata = {
  title: 'Expense Tracker',
  description: 'AI-Powered Personal Finance Tracker',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
