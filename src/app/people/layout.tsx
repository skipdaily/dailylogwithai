import AppLayout from '@/components/AppLayout';

export default function PeopleLayout({
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
