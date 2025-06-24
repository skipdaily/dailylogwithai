import Navigation from '@/components/Navigation';

export default function ActionItemsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="md:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
