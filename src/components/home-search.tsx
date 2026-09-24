"use client";

import { useId, useMemo, useState } from "react";
import { ArrowUpRight, Search, X } from "lucide-react";
import { motion } from "motion/react";
import { useMotionPolicy } from "@/lib/motion/use-motion-policy";
import type { HomeGroup } from "@/server/homepage";

export function HomeSearch({ groups }: { groups: HomeGroup[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState<HomeGroup | null>(null);
  const { reduced, transition } = useMotionPolicy();
  const listId = useId();
  const results = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("id-ID");
    return term
      ? groups
          .filter((group) =>
            `${group.name} ${group.category}`
              .toLocaleLowerCase("id-ID")
              .includes(term),
          )
          .slice(0, 8)
      : [];
  }, [query, groups]);
  function choose(group: HomeGroup) {
    setSelected(group);
    setQuery(group.name);
    setOpen(false);
  }
  return (
    <div className="home-search">
      <label htmlFor="home-product-search">Cari produk</label>
      <div className="home-search-box">
        <Search size={22} aria-hidden="true" />
        <input
          id="home-product-search"
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open && query.trim().length > 0}
          aria-controls={listId}
          aria-activedescendant={
            open && results[active] ? `${listId}-${active}` : undefined
          }
          autoComplete="off"
          placeholder="Cari game atau layanan digital"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
            setOpen(true);
            setSelected(null);
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
              choose(results[active]);
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
              setSelected(null);
              setOpen(false);
              document.getElementById("home-product-search")?.focus();
            }}
          >
            <X size={19} />
          </button>
        )}
      </div>
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
                <button
                  type="button"
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={index === active}
                  tabIndex={-1}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(group)}
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
                </button>
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
      {selected && (
        <p className="search-selection" role="status">
          <strong>{selected.name}</strong> dipilih untuk pratinjau. Halaman
          produk belum tersedia.
        </p>
      )}
    </div>
  );
}
