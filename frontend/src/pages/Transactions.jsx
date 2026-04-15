import { LiveBadge, PageHeader } from '../components/shared/Layout'
import { TransactionFeed } from '../components/transactions/TransactionFeed'

export default function Transactions() {
  return (
    <div className="p-6">
      <PageHeader
        title="Transactions"
        subtitle="Live transaction feed with anomaly highlighting"
        right={<LiveBadge />}
      />
      <TransactionFeed />
    </div>
  )
}
