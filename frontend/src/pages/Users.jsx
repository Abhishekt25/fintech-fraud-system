import { LiveBadge, PageHeader } from '../components/shared/Layout'
import { UserRiskMonitor } from '../components/users/UserRiskMonitor'

export default function UsersPage() {
  return (
    <div className="p-4 lg:p-6">
      <PageHeader
        title="Users"
        subtitle="Per-user risk profiles and account controls"
        right={<LiveBadge />}
      />
      <UserRiskMonitor />
    </div>
  )
}
