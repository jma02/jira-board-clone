import type { Metadata } from "next";
import "./globals.css";
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Jira Board Clone | Atlassian",
  description: "A Jira board clone built with Next.js and styled with Atlassian Design System",
};

// Atlassian Navigation Component
function AtlassianNavigation() {
  return (
    <header className="bg-white border-b border-[#dfe1e6] shadow-sm">
      <div className="max-w-[1440px] mx-auto px-4">
        <div className="h-14 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <div className="flex items-center">
                <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.00098 15.9989C2.00098 8.27831 8.28036 2 16.001 2C23.7216 2 30 8.27938 30 15.9989C30 23.7196 23.7206 30 16.001 30C8.28036 30 2.00098 23.7196 2.00098 15.9989Z" fill="#2684FF"/>
                  <path d="M16.001 7.19995C11.1369 7.19995 7.20195 11.1349 7.20195 15.999C7.20195 20.863 11.1369 24.798 16.001 24.798C20.865 24.798 24.8 20.863 24.8 15.999C24.8 11.1349 20.865 7.19995 16.001 7.19995Z" fill="white"/>
                </svg>
                <span className="ml-2 text-lg font-semibold text-[#172B4D]">Jira</span>
              </div>
            </Link>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <a href="#" className="px-3 py-2 text-sm font-medium text-[#0052CC] bg-[#E9F2FF] rounded">Your work</a>
              <a href="#" className="px-3 py-2 text-sm font-medium text-[#42526E] hover:bg-[#EBECF0] rounded">Projects</a>
              <a href="#" className="px-3 py-2 text-sm font-medium text-[#42526E] hover:bg-[#EBECF0] rounded">Filters</a>
              <a href="#" className="px-3 py-2 text-sm font-medium text-[#42526E] hover:bg-[#EBECF0] rounded">Dashboards</a>
              <a href="#" className="px-3 py-2 text-sm font-medium text-[#42526E] hover:bg-[#EBECF0] rounded">Teams</a>
            </nav>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative hidden md:block w-64">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="atlaskit-input pl-4 pr-10 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-4 w-4 text-[#5E6C84]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* User Menu */}
            <div className="flex items-center space-x-2 ml-2">
              <button className="p-1 rounded-full hover:bg-[#EBECF0] text-[#5E6C84]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              
              <button className="p-1 rounded-full hover:bg-[#EBECF0] text-[#5E6C84]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              
              <div className="h-8 w-8 rounded-full bg-[#0052CC] flex items-center justify-center text-white font-medium text-sm">
                U
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-[#F4F5F7]">
      <body className="h-full min-h-screen flex flex-col">
        <AtlassianNavigation />
        <main className="flex-1 py-6 px-4">
          <div className="max-w-[1440px] mx-auto">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
