"use client";

import { useEffect, useRef, useState } from "react";
import type { SidebarNavProps } from "./SidebarNav.interfaces";
import styles from "./SidebarNav.module.css";

export function SidebarNav({ feeds }: SidebarNavProps) {
  const [activeId, setActiveId] = useState<string>("");
  const navRef = useRef<HTMLElement>(null);

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

  // Auto-scroll sidebar to show active item
  useEffect(() => {
    if (activeId && navRef.current) {
      const activeLink = navRef.current.querySelector(`a[href="#${activeId}"]`);
      if (activeLink) {
        activeLink.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [activeId]);

  return (
    <aside className={styles.sidebar} ref={navRef}>
      <nav className={styles.stickyNav}>
        <h3 className={styles.title}>Fuentes</h3>
        <ul className={styles.list}>
          {feeds.map((feed) => (
            <li key={feed.id}>
              <a
                href={`#${feed.id}`}
                className={`${styles.link} ${
                  activeId === feed.id ? styles.active : ""
                }`}
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
