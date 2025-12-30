"use client";

import { useEffect, useState } from "react";

export interface SidebarNavProps {
  feeds: { id: string; name: string }[];
}

export function SidebarNav({ feeds }: SidebarNavProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-20% 0px -80% 0px",
      }
    );

    feeds.forEach((feed) => {
      const element = document.getElementById(feed.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [feeds]);

  return (
    <aside className="sidebar-nav">
      <nav className="sticky-nav">
        <h3 className="nav-title">Fuentes</h3>
        <ul className="nav-list">
          {feeds.map((feed) => (
            <li key={feed.id}>
              <a
                href={`#${feed.id}`}
                className={`nav-link ${activeId === feed.id ? "active" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(feed.id)?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
              >
                {feed.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
