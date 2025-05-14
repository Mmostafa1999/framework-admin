import "./[locale]/globals.css";
import { Rubik, Cairo } from 'next/font/google';

const rubik = Rubik({
    subsets: ['latin'],
    variable: '--font-rubik',
    weight: ['400', '500', '700'],
    display: 'swap',
});

const cairo = Cairo({
    subsets: ['arabic'],
    variable: '--font-cairo',
    weight: ['400', '500', '700'],
    display: 'swap',
});

export default function Layout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html suppressHydrationWarning>
            <body className={`${rubik.variable} ${cairo.variable} antialiased`}>
                {children}
            </body>
        </html>
    );
} 