import "server-only";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const env = {
  get mongodbUri() {
    return required("MONGODB_URI");
  },
  get authSecret() {
    const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
    if (!secret || secret.length < 32) {
      throw new Error("NEXTAUTH_SECRET must be set to a random string of at least 32 characters");
    }
    return secret;
  },
  imageProvider: (process.env.IMAGE_STORAGE_PROVIDER ?? "local") as "local" | "cloudinary" | "imagekit",
  imageStorageUrl: process.env.IMAGE_STORAGE_URL ?? "",
  imageStorageApiKey: process.env.IMAGE_STORAGE_API_KEY ?? "",
  paymentSecretKey: process.env.PAYMENT_SECRET_KEY ?? "",
  paymentPublicKey: process.env.NEXT_PUBLIC_PAYMENT_KEY ?? "",
  isProd: process.env.NODE_ENV === "production",
};

export const paymentsEnabled = () => Boolean(env.paymentSecretKey && env.paymentPublicKey);
