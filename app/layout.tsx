import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"Almoçômetro",description:"Confirmação diária de almoço e acompanhamento de respostas.",robots:{index:false,follow:false},icons:{icon:"/favicon.svg"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>}
