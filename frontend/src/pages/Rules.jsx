import { LiveBadge, PageHeader } from '../components/shared/Layout'
import { RuleEngine } from '../components/rules/RuleEngine'

export default function RulesPage() {
  return (
    <div className="p-6">
      <PageHeader
        title="Rule Engine"
        subtitle="Dynamically configurable fraud detection rules"
        right={<LiveBadge />}
      />
      <RuleEngine />
    </div>
  )
}
