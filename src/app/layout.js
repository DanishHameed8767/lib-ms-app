import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";
import Providers from "./providers";

export const metadata = {
    title: "Libra",
    description: "Library Management UI",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <AuthProvider>
                    <Providers>{children}</Providers>
                </AuthProvider>
            </body>
        </html>
    );
}
