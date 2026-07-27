import { useState } from 'react';
import { Share, Check } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';

export function ShareButton({ slug, title }: { slug: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/p/${slug}`;

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user cancelled the native share sheet, fall through to clipboard copy
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant="secondary" onClick={handleShare}>
      {copied ? <Check size={18} /> : <Share size={18} />}
      {copied ? 'Copié !' : 'Partager'}
    </Button>
  );
}
