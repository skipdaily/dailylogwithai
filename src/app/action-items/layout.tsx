import AppLayout from '@/components/AppLayout';

export default function ActionItemsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout>
      {children}
    </AppLayout>
  );
}
