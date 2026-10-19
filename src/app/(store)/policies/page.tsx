import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { Reveal } from "@/components/motion";
import { getSettings } from "@/services/settings.service";

export const metadata: Metadata = { title: "Shipping, Returns & Care", alternates: { canonical: "/policies" } };

export default async function PoliciesPage() {
  const s = await getSettings();
  const blocks = [
    { id: "shipping", title: "Shipping", body: s.policies.shipping || `Orders are delivered in ${s.shipping.estimatedDelivery}.` },
    { id: "returns", title: "Returns & exchange", body: s.policies.returns || "Easy returns within 7 days of delivery." },
    { id: "care", title: "Jewellery care", body: s.policies.care },
  ];
  return (
    <section className="container-lux max-w-3xl py-10 sm:py-16">
      <Breadcrumbs items={[{ label: "Policies" }]} />
      <h1 className="mt-6 text-5xl">Shipping, returns & care</h1>
      <div className="mt-12 space-y-12">
        {blocks.map((b) => (
          <Reveal key={b.id}>
            <article id={b.id} className="scroll-mt-28 rounded-3xl border border-border bg-card p-8">
              <h2 className="text-3xl">{b.title}</h2>
              <p className="mt-4 whitespace-pre-line leading-relaxed text-stone">{b.body}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
