import '../styles/globals.css';
import '@livekit/components-styles';
import '@livekit/components-styles/prefabs';
import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: {
    default: 'Success Class | Powered by Orbit',
    template: '%s',
  },
  description:
    'Experience crystal clear video and audio at the Success Class, powered by state-of-the-art Orbit technology.',
  twitter: {
    creator: '@orbitconf',
    site: '@orbitconf',
    card: 'summary_large_image',
  },
  openGraph: {
    url: 'https://orbit.eburon.ai',
    images: [
      {
        url: 'https://orbit.eburon.ai/images/orbit-open-graph.png',
        width: 2000,
        height: 1000,
        type: 'image/png',
      },
    ],
    siteName: 'Success Class',
  },
  icons: {
    icon: {
      rel: 'icon',
      url: '/favicon.ico',
    },
    apple: [
      {
        rel: 'apple-touch-icon',
        url: '/images/orbit-apple-touch.png',
        sizes: '180x180',
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#070707',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body data-lk-theme="default">
        <Toaster />
        {children}
      </body>
    </html>
  );
}
