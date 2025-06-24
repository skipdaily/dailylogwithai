import Navigation from '@/components/Navigation'

export default function CrewMembersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="md:ml-64">
        <div className="p-4 md:p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
