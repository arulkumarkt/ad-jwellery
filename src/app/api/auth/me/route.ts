import { handler, ok } from "@/lib/api";
import { getCustomerSession } from "@/lib/auth";

export const GET = handler(async () => ok(await getCustomerSession()));
