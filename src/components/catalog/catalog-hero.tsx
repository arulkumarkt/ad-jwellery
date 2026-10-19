import Image from "next/image";
import { Breadcrumbs, type Crumb } from "@/components/common/breadcrumbs";
import { ImageReveal, Reveal } from "@/components/motion";
import type { ReactNode } from "react";

export function CatalogHero({
  eyebrow,
  title,
  description,
  image,
  crumbs,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  image?: string;
  crumbs: Crumb[];
  children?: ReactNode;
}) {
  return (
    <section className="container-lux pb-8 pt-6 sm:pb-12">
      <Breadcrumbs items={crumbs} />
      <div className={image ? "mt-6 grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]" : "mt-8"}>
        <Reveal>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="mt-3 text-balance text-4xl leading-[1.05] sm:text-6xl">{title}</h1>
          {description && <p className="mt-4 max-w-xl text-pretty text-stone">{description}</p>}
          {children && <div className="mt-6">{children}</div>}
        </Reveal>
        {image && (
          <ImageReveal className="relative hidden aspect-[16/9] rounded-[2rem] lg:block">
            <Image src={image} alt="" fill priority sizes="45vw" className="object-cover" />
          </ImageReveal>
        )}
      </div>
    </section>
  );
}
