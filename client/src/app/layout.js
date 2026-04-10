import Navbar from '@/components/Navbar';
import '@/styles/globals.css';

export const metadata = {
  title: 'Expense Tracker',
  description: 'AI-Powered Personal Finance Tracker',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
