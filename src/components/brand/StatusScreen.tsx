import { ReactNode } from "react";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

/** Full-page loading / error / not-found state that still carries the header and footer. */
export default function StatusScreen({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 grid place-items-center px-6 py-12 text-center">{children}</main>
      <SiteFooter />
    </div>
  );
}
