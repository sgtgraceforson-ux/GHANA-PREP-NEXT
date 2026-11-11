import { Inter } from "next/font/google";
import "./product.css";
import { Shell } from "@/components/shell";
import { TutorChat } from "@/components/tutor-chat";

const inter = Inter({ subsets: ["latin"] });

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className={`gp-ui ${inter.className}`}>
        <Shell>{children}</Shell>
      </div>
      {/* outside .gp-ui so the product reset does not restyle the tutor's buttons */}
      <div className={inter.className}><TutorChat /></div>
    </>

  );
}
