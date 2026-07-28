"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Chevron-separated trail, home icon first, current page rendered as plain text (not a link) —
 * the standard convention absent a specific reference to match. Every authenticated page passes
 * its own crumb list; AppShell doesn't infer this from the URL since a couple of routes (e.g.
 * /admin/users) need a label ("Users") that doesn't literally match the path segment.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
      <Link href="/dashboard" className="flex items-center hover:text-slate-700 dark:hover:text-slate-200" aria-label="Dashboard">
        <FontAwesomeIcon icon={icons.dashboard} />
      </Link>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={item.label} className="flex items-center gap-1.5">
            <FontAwesomeIcon icon={icons.chevronRight} className="text-[10px] text-slate-300 dark:text-slate-600" />
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-slate-700 dark:hover:text-slate-200">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "font-medium text-slate-700 dark:text-slate-200" : ""}>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
