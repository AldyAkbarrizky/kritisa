import Image from "next/image";
import logoWebp from "@/../public/Kritisa Logo.webp";

export function BrandIcon({ className = "size-9" }: { className?: string }) {
  return (
    <Image
      src={logoWebp}
      alt="Kritisa"
      className={className}
      width={36}
      height={36}
      priority
    />
  );
}
