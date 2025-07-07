import AppLayout from '@/components/AppLayout';

export default function LogsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppLayout>
      {children}
    </AppLayout>
  );
}
