import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { ApiError } from "@/lib/api";
import { hashPassword, startCustomerSession, verifyPassword } from "@/lib/auth";
import { serializeAddress, serializeCustomer } from "@/lib/serializers";
import type { AddressInput } from "@/lib/validators";
import { Address, Customer } from "@/models";
import type { AddressDTO, CustomerDTO } from "@/types";

export async function getProfile(customerId: string): Promise<CustomerDTO> {
  await connectDB();
  const doc = await Customer.findById(customerId).lean();
  if (!doc) throw new ApiError("Account not found", 404);
  return serializeCustomer(doc);
}

export async function updateProfile(
  customerId: string,
  input: { name: string; phone: string; marketingOptIn: boolean },
): Promise<CustomerDTO> {
  await connectDB();
  const doc = await Customer.findByIdAndUpdate(customerId, input, { returnDocument: "after", runValidators: true }).lean();
  if (!doc) throw new ApiError("Account not found", 404);
  // Refresh the cookie so the navbar shows the new name.
  await startCustomerSession({ id: customerId, name: doc.name, email: doc.email, v: doc.sessionVersion ?? 0 });
  return serializeCustomer(doc);
}

/** Changing the password revokes every other session by bumping sessionVersion. */
export async function changePassword(customerId: string, currentPassword: string, newPassword: string): Promise<void> {
  await connectDB();
  const doc = await Customer.findById(customerId).select("+passwordHash name email sessionVersion");
  if (!doc) throw new ApiError("Account not found", 404);
  if (!(await verifyPassword(currentPassword, doc.passwordHash))) {
    throw new ApiError("Current password is incorrect", 422, { currentPassword: "Incorrect password" });
  }
  doc.passwordHash = await hashPassword(newPassword);
  doc.sessionVersion = (doc.sessionVersion ?? 0) + 1;
  await doc.save();
  await startCustomerSession({ id: customerId, name: doc.name, email: doc.email, v: doc.sessionVersion });
}

export async function listAddresses(customerId: string): Promise<AddressDTO[]> {
  await connectDB();
  const docs = await Address.find({ customer: customerId }).sort({ isDefault: -1, updatedAt: -1 }).lean();
  return docs.map(serializeAddress);
}

async function clearDefault(customerId: string, exceptId?: Types.ObjectId) {
  await Address.updateMany({ customer: customerId, ...(exceptId ? { _id: { $ne: exceptId } } : {}) }, { $set: { isDefault: false } });
}

export async function createAddress(customerId: string, input: AddressInput): Promise<AddressDTO> {
  await connectDB();
  const count = await Address.countDocuments({ customer: customerId });
  if (count >= 20) throw new ApiError("You can save up to 20 addresses", 422);
  const isDefault = input.isDefault || count === 0;
  const doc = await Address.create({ ...input, customer: customerId, isDefault });
  if (isDefault) await clearDefault(customerId, doc._id);
  return serializeAddress(doc.toObject());
}

export async function updateAddress(customerId: string, id: string, input: AddressInput): Promise<AddressDTO> {
  await connectDB();
  const doc = await Address.findOneAndUpdate({ _id: id, customer: customerId }, input, {
    returnDocument: "after",
    runValidators: true,
  }).lean();
  if (!doc) throw new ApiError("Address not found", 404);
  if (input.isDefault) await clearDefault(customerId, doc._id);
  return serializeAddress(doc);
}

export async function deleteAddress(customerId: string, id: string): Promise<void> {
  await connectDB();
  const doc = await Address.findOneAndDelete({ _id: id, customer: customerId }).lean();
  if (!doc) throw new ApiError("Address not found", 404);
  if (doc.isDefault) {
    const next = await Address.findOne({ customer: customerId }).sort({ updatedAt: -1 });
    if (next) {
      next.isDefault = true;
      await next.save();
    }
  }
}
