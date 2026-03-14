import { AuthProvider } from '../context/AuthContext';

export const metadata = {
  title: 'CupidSecure Auth',
  description: 'Authentication for CupidSecure',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      </head>
      <body style={{ backgroundColor: '#0d0107', margin: 0, fontFamily: 'Inter, sans-serif' }}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
