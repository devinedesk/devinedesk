import { Link } from "react-router-dom";

interface LogoProps {
  /** Size in pixels (applied to both width & height). */
  size?: number;
  /** Show the "DevineDesk" wordmark next to the icon. */
  withText?: boolean;
  /** Wrap the logo in a link to "/". */
  linked?: boolean;
  className?: string;
}

/**
 * DevineDesk brand logo — the real `/logo.png` image, optionally with the
 * wordmark. Used in the Navbar, Footer, auth pages, and anywhere the brand
 * mark appears.
 */
export function Logo({ size = 32, withText = false, linked = false, className = "" }: LogoProps) {
  const img = (
    <img
      src="/logo.png"
      alt="DevineDesk"
      width={size}
      height={size}
      className={`rounded-lg ${className}`}
      style={{ height: size, width: size }}
    />
  );

  const content = (
    <span className="flex shrink-0 items-center gap-2.5">
      {img}
      {withText && (
        <span className="text-[15px] font-semibold tracking-tight">DevineDesk</span>
      )}
    </span>
  );

  if (linked) {
    return <Link to="/">{content}</Link>;
  }
  return content;
}
