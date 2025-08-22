"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  NAV_MEMBERS,
  NAV_PROSPECTIVE_MEMBER,
  NAV_REGISTERED_MEMBER,
} from "./data";
import { ArrowLeftIcon, ChevronUp } from "./icons";
import { MenuItem } from "./menu-item";
import { useSidebarContext } from "./sidebar-context";
import { useAuth } from "@/hooks/useAuth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { setIsOpen, isOpen, isMobile, toggleSidebar } = useSidebarContext();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [registration, setRegistration] = useState<boolean | null>(false);

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) => (prev.includes(title) ? [] : [title]));
  };

  useEffect(() => {
    if (user?.uid) {
      const fetchRole = async () => {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);

          const docRefCaang = doc(db, "caang_registration", user.uid);
          const docSnapCaang = await getDoc(docRefCaang);

          if (docSnapCaang.exists()) {
            setRegistration(docSnapCaang.data()?.registration === true);
          } else {
            setRegistration(false);
          }

          if (docSnap.exists()) {
            setRole(docSnap.data().role || null);
          } else {
            setRole(null);
          }
        } catch (error) {
          console.error("Gagal mengambil role:", error);
          setRole(null);
        }
      };
      fetchRole();
    }
  }, [user?.uid]);

  // const NAV_DATA = role === "member" ? NAV_MEMBERS : NAV_PROSPECTIVE_MEMBER;
  const NAV_DATA =
    role === "member"
      ? NAV_MEMBERS
      : registration === true
      ? NAV_REGISTERED_MEMBER
      : NAV_PROSPECTIVE_MEMBER;

  useEffect(() => {
    // Keep collapsible open, when its subpage is active
    NAV_DATA.some((section) => {
      return section.items.some((item) => {
        return item.items.some((subItem) => {
          // gunakan pengecekan aman: jika subItem.url undefined, skip
          if (subItem.url && subItem.url === pathname) {
            if (!expandedItems.includes(item.title)) {
              toggleExpanded(item.title);
            }
            return true; // break
          }
          return false;
        });
      });
    });
  }, [NAV_DATA, expandedItems, pathname]);

  // helper: buat href fallback dari title (slug)
  const slugFromTitle = (title: string) =>
    "/" + title.toLowerCase().trim().split(/\s+/).join("-");

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "max-w-[290px] overflow-hidden border-r border-gray-200 bg-white transition-[width] duration-200 ease-linear dark:border-gray-800 dark:bg-gray-dark",
          isMobile ? "fixed bottom-0 top-0 z-50" : "sticky top-0 h-screen",
          isOpen ? "w-full" : "w-0"
        )}
        aria-label="Main navigation"
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <div className="flex h-full flex-col py-10 pl-[25px] pr-[7px]">
          <div className="relative pr-4.5">
            <Link
              href={"/"}
              onClick={() => isMobile && toggleSidebar()}
              className="flex items-center gap-3.5 px-0 py-2 min-[850px]:py-0"
            >
              <Image
                src="/images/logo/logo.webp"
                alt="Logo Robotik PNP"
                width={55}
                height={55}
              />
              <span className="text-lg font-semibold">Robotik PNP</span>
            </Link>

            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="absolute left-3/4 right-4.5 top-1/2 -translate-y-1/2 text-right"
              >
                <span className="sr-only">Close Menu</span>

                <ArrowLeftIcon className="ml-auto size-7" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <div className="custom-scrollbar mt-6 flex-1 overflow-y-auto pr-3 min-[850px]:mt-10">
            {NAV_DATA.map((section) => (
              <div key={section.label} className="mb-6">
                <h2 className="mb-5 text-sm font-medium text-dark-4 dark:text-dark-6">
                  {section.label}
                </h2>

                <nav role="navigation" aria-label={section.label}>
                  <ul className="space-y-2">
                    {section.items.map((item) => {
                      const Icon = item.icon; // narrowing untuk ikon

                      // Jika item punya subitems -> collapsible
                      if (item.items.length) {
                        return (
                          <li key={item.title}>
                            <div>
                              <MenuItem
                                isActive={item.items.some(
                                  ({ url }) => url === pathname
                                )}
                                onClick={() => toggleExpanded(item.title)}
                              >
                                {Icon ? (
                                  <Icon
                                    className="size-6 shrink-0"
                                    aria-hidden="true"
                                  />
                                ) : null}

                                <span>{item.title}</span>

                                <ChevronUp
                                  className={cn(
                                    "ml-auto rotate-180 transition-transform duration-200",
                                    expandedItems.includes(item.title) &&
                                      "rotate-0"
                                  )}
                                  aria-hidden="true"
                                />
                              </MenuItem>

                              {expandedItems.includes(item.title) && (
                                <ul
                                  className="ml-9 mr-0 space-y-1.5 pb-[15px] pr-0 pt-2"
                                  role="menu"
                                >
                                  {item.items.map((subItem) => {
                                    // pastikan href selalu string (fallback ke slug)
                                    const subHref =
                                      subItem.url ??
                                      slugFromTitle(subItem.title);
                                    return (
                                      <li key={subItem.title} role="none">
                                        <MenuItem
                                          as="link"
                                          href={subHref}
                                          isActive={pathname === subHref}
                                        >
                                          <span>{subItem.title}</span>
                                        </MenuItem>
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </div>
                          </li>
                        );
                      }

                      // Non-collapsible item
                      const href = item.url ?? slugFromTitle(item.title);

                      return (
                        <li key={item.title}>
                          <MenuItem
                            className="flex items-center gap-3 py-3"
                            as="link"
                            href={href}
                            isActive={pathname === href}
                          >
                            {Icon ? (
                              <Icon
                                className="size-6 shrink-0"
                                aria-hidden="true"
                              />
                            ) : null}

                            <span>{item.title}</span>
                          </MenuItem>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
