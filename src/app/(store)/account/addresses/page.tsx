import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AddressBook } from "@/components/account/address-book";
import { getVerifiedCustomer } from "@/lib/auth";
import { listAddresses } from "@/services/account.service";

export const metadata: Metadata = { title: "Saved addresses" };

export default async function AddressesPage() {
  const customer = await getVerifiedCustomer();
  if (!customer) redirect("/login?next=/account/addresses");
  const addresses = await listAddresses(customer.id);
  return <AddressBook initial={addresses} customerName={customer.name} />;
}
