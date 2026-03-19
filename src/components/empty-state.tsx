type EmptyStateProps = {
  title: string
  description: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="empty-card">
      <p className="eyebrow">Waiting for content</p>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  )
}
