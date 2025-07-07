import AppLayout from '@/components/AppLayout'

export default function CrewMembersLayout({
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
