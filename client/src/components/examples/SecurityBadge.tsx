import SecurityBadge from '../SecurityBadge';

export default function SecurityBadgeExample() {
  return (
    <div className="flex flex-wrap gap-4 p-6 bg-background">
      <SecurityBadge score={95} size="lg" />
      <SecurityBadge score={75} size="md" />
      <SecurityBadge score={50} size="md" />
      <SecurityBadge score={25} size="sm" />
    </div>
  );
}
