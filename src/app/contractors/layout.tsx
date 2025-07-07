import AppLayout from '@/components/AppLayout';

export default function ContractorsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppLayout>
      {children}
    </AppLayout>
  )
}
