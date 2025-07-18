import AppLayout from '@/components/AppLayout';

export default function AssistantLayout({
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
