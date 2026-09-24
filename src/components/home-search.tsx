"use client";

import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpRight, Search, X } from "lucide-react";
import { motion } from "motion/react";
import { useMotionPolicy } from "@/lib/motion/use-motion-policy";
import {
  catalogHref,
  categorySlugs,
  rankSearchText,
} from "@/lib/catalog-discovery";
import type { HomeGroup } from "@/server/homepage";

function groupHref(group: HomeGroup): string {
  return group.category === "game"
    ? `/games/${group.slug}`
    : catalogHref({
        q: group.name,
        category: categorySlugs.find((slug) => slug === group.category) ?? null,
      });
}

export function HomeSearch({ groups }: { groups: HomeGroup[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const { reduced, transition } = useMotionPolicy();
  const router = useRouter();
  const listId = useId();
  const results = useMemo(
    () =>
      query.trim()
        ? groups
            .map((group) => ({
              group,
              score: rankSearchText(group.name, query, "", group.category),
            }))
            .filter((result) => result.score < Infinity)
            .sort(
              (a, b) =>
                a.score - b.score ||
                a.group.name.localeCompare(b.group.name, "id"),
            )
            .slice(0, 8)
            .map((result) => result.group)
        : [],
    [query, groups],
  );
  return (
    <div className="home-search">
      <form action="/products" method="get" role="search">
        <label htmlFor="home-product-search">Cari produk</label>
        <div className="home-search-box">
          <Search size={22} aria-hidden="true" />
          <input
            id="home-product-search"
            name="q"
            type="search"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open && query.trim().length > 0}
            aria-controls={listId}
            aria-activedescendant={
              open && results[active] ? `${listId}-${active}` : undefined
            }
            autoComplete="off"
            maxLength={80}
            placeholder="Cari game atau layanan digital"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setOpen(false);
                return;
              }
              if (event.key === "ArrowDown" && results.length) {
                event.preventDefault();
                setActive((index) => (index + 1) % results.length);
                setOpen(true);
              }
              if (event.key === "ArrowUp" && results.length) {
                event.preventDefault();
                setActive(
                  (index) => (index - 1 + results.length) % results.length,
                );
                setOpen(true);
              }
              if (event.key === "Enter" && open && results[active]) {
                event.preventDefault();
                router.push(groupHref(results[active]));
              }
            }}
          />
          {query && (
            <button
              type="button"
              className="search-clear"
              aria-label="Hapus pencarian"
              onClick={() => {
                setQuery("");
                setOpen(false);
                document.getElementById("home-product-search")?.focus();
              }}
            >
              <X size={19} />
            </button>
          )}
          <button
            type="submit"
            className="home-search-submit"
            aria-label="Cari di katalog"
          >
            <ArrowRight size={20} />
          </button>
        </div>
      </form>
      {open && query.trim() && (
        <motion.div
          className="search-results"
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={reduced ? { duration: 0 } : transition}
        >
          <div className="search-results-heading">Hasil katalog demo</div>
          <ul id={listId} role="listbox" aria-label="Hasil pencarian">
            {results.map((group, index) => (
              <li key={group.slug} role="presentation">
                <a
                  href={groupHref(group)}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={index === active}
                  tabIndex={-1}
                  onMouseEnter={() => setActive(index)}
                >
                  <span className="search-result-mark" aria-hidden="true">
                    {group.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span>
                    <strong>{group.name}</strong>
                    <small>
                      {group.category === "game" ? "Game" : "Layanan digital"} ·{" "}
                      {group.packages} pilihan ·{" "}
                      {group.available ? "Contoh tersedia" : "Belum tersedia"}
                    </small>
                  </span>
                  <ArrowUpRight size={18} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
          {results.length === 0 && (
            <p className="search-empty">
              Belum ada produk demo yang cocok. Coba kata lain.
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}
