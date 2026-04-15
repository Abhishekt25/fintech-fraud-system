import { LiveBadge, PageHeader } from '../components/shared/Layout'
import { StatsGrid } from '../components/dashboard/StatsGrid'
import { TransactionFeed } from '../components/transactions/TransactionFeed'
import { UserRiskMonitor } from '../components/users/UserRiskMonitor'

export default function Dashboard() {
  return (
    <div className="p-6">
      <PageHeader
        title="Dashboard"
        subtitle="Real-time transaction monitoring and risk overview"
        right={<LiveBadge />}
      />

      <StatsGrid />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">
        <TransactionFeed maxRows={12} />
        <UserRiskMonitor maxRows={8} compact />
      </div>
    </div>
  )
}
