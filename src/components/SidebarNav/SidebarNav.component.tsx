"use client";

import { useEffect, useRef, useState } from "react";
import type { SidebarNavProps } from "./SidebarNav.interfaces";
import styles from "./SidebarNav.module.css";

export function SidebarNav({ feeds }: SidebarNavProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const handleFeedClick = (feedId: string) => {
    document.getElementById(feedId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setIsMenuOpen(false);
  };

  // Group feeds by category
  const feedsByCategory = feeds.reduce((acc, feed) => {
    if (!acc[feed.category]) {
      acc[feed.category] = [];
    }
    acc[feed.category].push(feed);
    return acc;
  }, {} as Record<string, typeof feeds>);

  // Define category order
  const categoryOrder = ["Tech", "News", "Blogs"];

  return (
    <>
      {/* Hamburger button - only visible on mobile when menu is closed */}
      {!isMenuOpen && (
        <button
          type="button"
          className={styles.hamburger}
          onClick={() => setIsMenuOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={false}
        >
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
        </button>
      )}

      {/* Overlay backdrop */}
      {isMenuOpen && (
        <div
          className={styles.overlay}
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${isMenuOpen ? styles.sidebarOpen : ""}`}
        ref={navRef}
      >
        <nav className={styles.stickyNav}>
          <div className={styles.header}>
            <h3 className={styles.title}>Fuentes</h3>
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setIsMenuOpen(false)}
              aria-label="Cerrar menú"
            >
              ✕
            </button>
          </div>
          <div className={styles.categories}>
            {categoryOrder.map((category) => {
              const categoryFeeds = feedsByCategory[category];
              if (!categoryFeeds || categoryFeeds.length === 0) return null;

              return (
                <div key={category} className={styles.categorySection}>
                  <h4 className={styles.categoryTitle}>{category}</h4>
                  <ul className={styles.list}>
                    {categoryFeeds.map((feed) => (
                      <li key={feed.id}>
                        <a
                          href={`#${feed.id}`}
                          className={`${styles.link} ${
                            activeId === feed.id ? styles.active : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleFeedClick(feed.id);
                          }}
                        >
                          <span className={styles.feedName}>{feed.name}</span>
                          {feed.scrapingStatus === "error" && (
                            <span
                              className={styles.errorIndicator}
                              title="Error en actualización"
                            >
                              ⚠️
                            </span>
                          )}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
}
