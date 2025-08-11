import "./globals.css";

export const metadata = {
  title: 'QR Code Craft',
  description: 'Create and manage QR code microsites',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  )
}