import * as Icons from "../icons";
import type { ComponentType, SVGProps } from "react";

export type IconType = ComponentType<SVGProps<SVGSVGElement>>;

export type NavItem = {
  title: string;
  url?: string;
  icon?: IconType;
  items: NavItem[];
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export const NAV_MEMBERS: NavSection[] = [
  {
    label: "MAIN MENU",
    items: [
      {
        title: "Dashboard",
        icon: Icons.HomeIcon,
        items: [],
      },
    ],
  },
];

export const NAV_PROSPECTIVE_MEMBER: NavSection[] = [
  {
    label: "MAIN MENU",
    items: [
      {
        title: "Dashboard",
        icon: Icons.HomeIcon,
        items: [],
      },
      {
        title: "Pendaftaran",
        icon: Icons.Alphabet,
        items: [],
      },
    ],
  },
]

export const NAV_REGISTERED_MEMBER: NavSection[] = [
  {
    label: "MAIN MENU",
    items: [
      {
        title: "Dashboard",
        icon: Icons.HomeIcon,
        items: [],
      },
      {
        title: "Review Pendaftaran",
        icon: Icons.Alphabet,
        items: [],
      },
    ],
  },
]