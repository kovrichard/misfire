import { Caprasimo, Figtree } from "next/font/google";

export const heading = Caprasimo({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-caprasimo",
});

export const body = Figtree({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-figtree",
});
