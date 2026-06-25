import { PageTransitionWrapper } from "@/components/shared/page-transition-wrapper";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageTransitionWrapper>{children}</PageTransitionWrapper>;
}
