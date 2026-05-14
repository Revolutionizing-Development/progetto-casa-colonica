import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Progetto Casa Colonica',
  description: 'Italian farmhouse acquisition and renovation feasibility analysis',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
