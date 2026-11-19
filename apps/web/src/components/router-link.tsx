import { Link } from "@tanstack/react-router";
import type { ComponentProps } from "react";

/** Lets Plop's ButtonLink navigate through the router. */
export const RouterLink = ({ href, ...props }: ComponentProps<"a">) => (
  <Link to={href} {...props} />
);
