'use client'

import { useNavigation } from '@/contexts/NavigationContext';
import Navigation from '@/components/Navigation';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isCollapsed } = useNavigation();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div 
        className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          isCollapsed ? 'md:pl-16' : 'md:pl-64'
        }`}
      >
        <main className="flex-1 p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
