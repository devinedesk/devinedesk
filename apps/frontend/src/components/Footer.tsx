import { Link } from "react-router-dom";
import { Logo } from "./Logo";

const CONTACT_EMAIL = "support@devinedesk.com";

const PRODUCT_LINKS = [
  { to: "/video", label: "Video" },
  { to: "/image", label: "Image" },
  { to: "/user/templates", label: "Templates" },
  { to: "/billing", label: "Pricing" },
];

const LEGAL_LINKS = [
  { to: "/privacy", label: "Privacy Policy" },
  { to: "/refund", label: "Refund & Cancellation" },
  { to: "/terms", label: "Terms of Service" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-black">
      <div className="mx-auto grid max-w-[1600px] gap-10 px-4 py-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-6">
        {/* Brand */}
        <div>
          <Logo size={32} withText linked />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Generate cinematic AI videos, images, and personalized template renders in minutes.
          </p>
        </div>

        {/* Product */}
        <div>
          <h3 className="text-sm font-semibold">Product</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {PRODUCT_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="transition-colors hover:text-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h3 className="text-sm font-semibold">Legal</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {LEGAL_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="transition-colors hover:text-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-sm font-semibold">Contact</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="transition-colors hover:text-foreground"
              >
                {CONTACT_EMAIL}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row lg:px-6">
          <span>© {new Date().getFullYear()} DevineDesk. All rights reserved.</span>
          <div className="flex items-center gap-4">
            {LEGAL_LINKS.map((l) => (
              <Link key={l.to} to={l.to} className="transition-colors hover:text-foreground">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
