import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { ComponentProps } from "react";
export function ArrowLink({
  children,
  className = "",
  external = false,
  ...props
}: ComponentProps<"a"> & { external?: boolean }) {
  return (
    <a
      className={`button ${className}`}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...props}
    >
      {children}
      {external ? (
        <ArrowUpRight size={17} aria-hidden="true" />
      ) : (
        <ArrowRight size={17} aria-hidden="true" />
      )}
    </a>
  );
}
