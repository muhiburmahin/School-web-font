import Link from "next/link";
import { safeNextPath } from "@/lib/safe-next-path";
import { resolveCmsHref, safeCmsInternalPath, safeHttpsUrl, safeHttpUrl } from "@/lib/validation/url";

export function SafeLink({ href, children }: { href: string; children: React.ReactNode }) {
  const external = safeHttpUrl(href);
  if (external) {
    return (
      <a className="underline" href={external} rel="noopener noreferrer" target="_blank">
        {children}
      </a>
    );
  }
  const internal = safeNextPath(href);
  if (internal) {
    return (
      <Link className="rounded-md focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none" href={internal}>
        {children}
      </Link>
    );
  }
  return <span>{children}</span>;
}

export function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  const external = safeHttpUrl(href);
  if (!external) return <span>{children}</span>;
  return (
    <a className="underline" href={external} rel="noopener noreferrer" target="_blank">
      {children}
    </a>
  );
}

export function CmsLink({
  href,
  previewBase,
  className,
  children,
}: {
  href: string;
  previewBase?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const external = safeHttpsUrl(href);
  if (external) {
    return (
      <a className={className} href={external} rel="noopener noreferrer" target="_blank">
        {children}
      </a>
    );
  }
  const internal = safeCmsInternalPath(href);
  if (internal) {
    const destination = resolveCmsHref(internal, previewBase);
    return (
      <Link className={className} href={destination}>
        {children}
      </Link>
    );
  }
  return <span className={className}>{children}</span>;
}
