import crypto from "node:crypto";

const algorithm = "aes-256-ctr";
const secretKey =Buffer.from(process.env.AES_SECRET_KEY || "", "base64");

export const encryptAES256CTR = (data: string) => {
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  const encrypted = Buffer.concat([cipher.update(data, "utf-8"), cipher.final()]);
  return Buffer.concat([iv, encrypted]).toString("base64");
};

export const decryptAES256CTR = (data: string) => {
  const buffer = Buffer.from(data, "base64");
  const iv = buffer.subarray(0, 16);
  const encrypted = buffer.subarray(16);
  const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  return decrypted.toString("utf-8");
};
