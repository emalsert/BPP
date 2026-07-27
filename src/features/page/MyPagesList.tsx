import { Link } from 'react-router-dom';
import { ClockCounterClockwise } from '@phosphor-icons/react';
import { Card } from '@/components/ui/Card';
import { getKnownPages } from '@/lib/identity';

export function MyPagesList() {
  const pages = getKnownPages();
  if (pages.length === 0) return null;

  return (
    <Card className="p-6">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-white/80">
        <ClockCounterClockwise size={18} />
        Mes pages
      </h2>
      <ul className="space-y-2">
        {pages.map((page) => (
          <li key={page.slug}>
            <Link
              to={`/p/${page.slug}`}
              className="block rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white hover:bg-white/10"
            >
              {page.title}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
