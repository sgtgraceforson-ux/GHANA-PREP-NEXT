import { Inter } from "next/font/google";
import "./product.css";
import { Shell } from "@/components/shell";

const inter = Inter({ subsets: ["latin"] });

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`gp-ui ${inter.className}`}>
      <Shell>{children}</Shell>
    </div>
  );
}
