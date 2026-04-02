var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/app.ts
import express from "express";
import { toNodeHandler } from "better-auth/node";

// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

// src/lib/prisma.ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

// generated/prisma/client.ts
import * as path from "path";
import { fileURLToPath } from "url";

// generated/prisma/internal/class.ts
import * as runtime from "@prisma/client/runtime/client";
var config = {
  "previewFeatures": [],
  "clientVersion": "7.3.0",
  "engineVersion": "9d6ad21cbbceab97458517b147a6a09ff43aa735",
  "activeProvider": "postgresql",
  "inlineSchema": '// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\ngenerator client {\n  provider = "prisma-client"\n  output   = "../generated/prisma"\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n\nmodel User {\n  id               String    @id\n  name             String\n  email            String\n  emailVerified    Boolean   @default(false)\n  image            String?\n  createdAt        DateTime  @default(now())\n  updatedAt        DateTime  @updatedAt\n  role             String?   @default("STUDENT")\n  phone            String?\n  status           String?   @default("ACTIVE")\n  stripeCustomerId String?   @unique\n  sessions         Session[]\n  accounts         Account[]\n\n  // Application relations\n  tutorProfile TutorProfile?\n  bookings     Booking[]\n  reviews      Review[]\n  payments     Payment[]\n\n  @@unique([email])\n  @@map("user")\n}\n\nmodel Session {\n  id        String   @id\n  expiresAt DateTime\n  token     String\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  ipAddress String?\n  userAgent String?\n  userId    String\n  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@unique([token])\n  @@index([userId])\n  @@map("session")\n}\n\nmodel Account {\n  id                    String    @id\n  accountId             String\n  providerId            String\n  userId                String\n  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)\n  accessToken           String?\n  refreshToken          String?\n  idToken               String?\n  accessTokenExpiresAt  DateTime?\n  refreshTokenExpiresAt DateTime?\n  scope                 String?\n  password              String?\n  createdAt             DateTime  @default(now())\n  updatedAt             DateTime  @updatedAt\n\n  @@index([userId])\n  @@map("account")\n}\n\nmodel Verification {\n  id         String   @id\n  identifier String\n  value      String\n  expiresAt  DateTime\n  createdAt  DateTime @default(now())\n  updatedAt  DateTime @updatedAt\n\n  @@index([identifier])\n  @@map("verification")\n}\n\n// ==================== Application Models ====================\n\n// Enums\nenum BookingStatus {\n  PENDING\n  CONFIRMED\n  COMPLETED\n  CANCELLED\n}\n\nenum PaymentStatus {\n  PENDING\n  PAID\n  FAILED\n  REFUNDED\n}\n\nmodel TutorProfile {\n  id           String   @id @default(uuid())\n  userId       String   @unique\n  bio          String?\n  hourlyRate   Float\n  experience   Int      @default(0) // years of experience\n  rating       Float    @default(0)\n  totalReviews Int      @default(0)\n  isAvailable  Boolean  @default(true)\n  createdAt    DateTime @default(now())\n  updatedAt    DateTime @updatedAt\n\n  // Relations\n  user           User                @relation(fields: [userId], references: [id], onDelete: Cascade)\n  categories     TutorCategory[]\n  availabilities TutorAvailability[]\n  bookings       Booking[]\n  reviews        Review[]\n\n  @@map("tutor_profiles")\n}\n\nmodel Category {\n  id          String   @id @default(uuid())\n  name        String   @unique\n  description String?\n  icon        String?\n  createdAt   DateTime @default(now())\n  updatedAt   DateTime @updatedAt\n\n  // Relations\n  tutors TutorCategory[]\n\n  @@map("categories")\n}\n\nmodel TutorCategory {\n  id             String @id @default(uuid())\n  tutorProfileId String\n  categoryId     String\n\n  // Relations\n  tutorProfile TutorProfile @relation(fields: [tutorProfileId], references: [id], onDelete: Cascade)\n  category     Category     @relation(fields: [categoryId], references: [id], onDelete: Cascade)\n\n  @@unique([tutorProfileId, categoryId])\n  @@map("tutor_categories")\n}\n\nmodel TutorAvailability {\n  id             String   @id @default(uuid())\n  tutorProfileId String\n  dayOfWeek      Int // 0-6 (Sunday-Saturday)\n  startTime      String // HH:mm format\n  endTime        String // HH:mm format\n  createdAt      DateTime @default(now())\n  updatedAt      DateTime @updatedAt\n\n  // Relations\n  tutorProfile TutorProfile @relation(fields: [tutorProfileId], references: [id], onDelete: Cascade)\n\n  @@map("tutor_availabilities")\n}\n\nmodel Booking {\n  id                      String        @id @default(uuid())\n  studentId               String\n  tutorProfileId          String\n  scheduledAt             DateTime\n  duration                Int           @default(60) // in minutes\n  amount                  Int           @default(0)\n  currency                String        @default("usd")\n  status                  BookingStatus @default(PENDING)\n  paymentStatus           PaymentStatus @default(PENDING)\n  stripeCheckoutSessionId String?       @unique\n  stripePaymentIntentId   String?       @unique\n  paidAt                  DateTime?\n  notes                   String?\n  createdAt               DateTime      @default(now())\n  updatedAt               DateTime      @updatedAt\n\n  // Relations\n  student      User         @relation(fields: [studentId], references: [id], onDelete: Cascade)\n  tutorProfile TutorProfile @relation(fields: [tutorProfileId], references: [id], onDelete: Cascade)\n  review       Review?\n  payment      Payment?\n\n  @@map("bookings")\n}\n\nmodel Payment {\n  id                      String        @id @default(uuid())\n  bookingId               String        @unique\n  studentId               String\n  amount                  Int\n  currency                String        @default("usd")\n  status                  PaymentStatus @default(PENDING)\n  stripeCheckoutSessionId String?       @unique\n  stripePaymentIntentId   String?       @unique\n  paidAt                  DateTime?\n  createdAt               DateTime      @default(now())\n  updatedAt               DateTime      @updatedAt\n\n  booking Booking @relation(fields: [bookingId], references: [id], onDelete: Cascade)\n  student User    @relation(fields: [studentId], references: [id], onDelete: Cascade)\n\n  @@map("payments")\n}\n\nmodel Review {\n  id             String   @id @default(uuid())\n  rating         Int // 1-5\n  comment        String?\n  studentId      String\n  tutorProfileId String\n  bookingId      String   @unique\n  createdAt      DateTime @default(now())\n  updatedAt      DateTime @updatedAt\n\n  // Relations\n  student      User         @relation(fields: [studentId], references: [id], onDelete: Cascade)\n  tutorProfile TutorProfile @relation(fields: [tutorProfileId], references: [id], onDelete: Cascade)\n  booking      Booking      @relation(fields: [bookingId], references: [id], onDelete: Cascade)\n\n  @@map("reviews")\n}\n',
  "runtimeDataModel": {
    "models": {},
    "enums": {},
    "types": {}
  }
};
config.runtimeDataModel = JSON.parse('{"models":{"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"emailVerified","kind":"scalar","type":"Boolean"},{"name":"image","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"role","kind":"scalar","type":"String"},{"name":"phone","kind":"scalar","type":"String"},{"name":"status","kind":"scalar","type":"String"},{"name":"stripeCustomerId","kind":"scalar","type":"String"},{"name":"sessions","kind":"object","type":"Session","relationName":"SessionToUser"},{"name":"accounts","kind":"object","type":"Account","relationName":"AccountToUser"},{"name":"tutorProfile","kind":"object","type":"TutorProfile","relationName":"TutorProfileToUser"},{"name":"bookings","kind":"object","type":"Booking","relationName":"BookingToUser"},{"name":"reviews","kind":"object","type":"Review","relationName":"ReviewToUser"},{"name":"payments","kind":"object","type":"Payment","relationName":"PaymentToUser"}],"dbName":"user"},"Session":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"token","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"ipAddress","kind":"scalar","type":"String"},{"name":"userAgent","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"SessionToUser"}],"dbName":"session"},"Account":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"accountId","kind":"scalar","type":"String"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"AccountToUser"},{"name":"accessToken","kind":"scalar","type":"String"},{"name":"refreshToken","kind":"scalar","type":"String"},{"name":"idToken","kind":"scalar","type":"String"},{"name":"accessTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"refreshTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"scope","kind":"scalar","type":"String"},{"name":"password","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"account"},"Verification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"identifier","kind":"scalar","type":"String"},{"name":"value","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"verification"},"TutorProfile":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"bio","kind":"scalar","type":"String"},{"name":"hourlyRate","kind":"scalar","type":"Float"},{"name":"experience","kind":"scalar","type":"Int"},{"name":"rating","kind":"scalar","type":"Float"},{"name":"totalReviews","kind":"scalar","type":"Int"},{"name":"isAvailable","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"TutorProfileToUser"},{"name":"categories","kind":"object","type":"TutorCategory","relationName":"TutorCategoryToTutorProfile"},{"name":"availabilities","kind":"object","type":"TutorAvailability","relationName":"TutorAvailabilityToTutorProfile"},{"name":"bookings","kind":"object","type":"Booking","relationName":"BookingToTutorProfile"},{"name":"reviews","kind":"object","type":"Review","relationName":"ReviewToTutorProfile"}],"dbName":"tutor_profiles"},"Category":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"icon","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"tutors","kind":"object","type":"TutorCategory","relationName":"CategoryToTutorCategory"}],"dbName":"categories"},"TutorCategory":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"tutorProfileId","kind":"scalar","type":"String"},{"name":"categoryId","kind":"scalar","type":"String"},{"name":"tutorProfile","kind":"object","type":"TutorProfile","relationName":"TutorCategoryToTutorProfile"},{"name":"category","kind":"object","type":"Category","relationName":"CategoryToTutorCategory"}],"dbName":"tutor_categories"},"TutorAvailability":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"tutorProfileId","kind":"scalar","type":"String"},{"name":"dayOfWeek","kind":"scalar","type":"Int"},{"name":"startTime","kind":"scalar","type":"String"},{"name":"endTime","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"tutorProfile","kind":"object","type":"TutorProfile","relationName":"TutorAvailabilityToTutorProfile"}],"dbName":"tutor_availabilities"},"Booking":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"studentId","kind":"scalar","type":"String"},{"name":"tutorProfileId","kind":"scalar","type":"String"},{"name":"scheduledAt","kind":"scalar","type":"DateTime"},{"name":"duration","kind":"scalar","type":"Int"},{"name":"amount","kind":"scalar","type":"Int"},{"name":"currency","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"BookingStatus"},{"name":"paymentStatus","kind":"enum","type":"PaymentStatus"},{"name":"stripeCheckoutSessionId","kind":"scalar","type":"String"},{"name":"stripePaymentIntentId","kind":"scalar","type":"String"},{"name":"paidAt","kind":"scalar","type":"DateTime"},{"name":"notes","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"student","kind":"object","type":"User","relationName":"BookingToUser"},{"name":"tutorProfile","kind":"object","type":"TutorProfile","relationName":"BookingToTutorProfile"},{"name":"review","kind":"object","type":"Review","relationName":"BookingToReview"},{"name":"payment","kind":"object","type":"Payment","relationName":"BookingToPayment"}],"dbName":"bookings"},"Payment":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"bookingId","kind":"scalar","type":"String"},{"name":"studentId","kind":"scalar","type":"String"},{"name":"amount","kind":"scalar","type":"Int"},{"name":"currency","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"PaymentStatus"},{"name":"stripeCheckoutSessionId","kind":"scalar","type":"String"},{"name":"stripePaymentIntentId","kind":"scalar","type":"String"},{"name":"paidAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"booking","kind":"object","type":"Booking","relationName":"BookingToPayment"},{"name":"student","kind":"object","type":"User","relationName":"PaymentToUser"}],"dbName":"payments"},"Review":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"rating","kind":"scalar","type":"Int"},{"name":"comment","kind":"scalar","type":"String"},{"name":"studentId","kind":"scalar","type":"String"},{"name":"tutorProfileId","kind":"scalar","type":"String"},{"name":"bookingId","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"student","kind":"object","type":"User","relationName":"ReviewToUser"},{"name":"tutorProfile","kind":"object","type":"TutorProfile","relationName":"ReviewToTutorProfile"},{"name":"booking","kind":"object","type":"Booking","relationName":"BookingToReview"}],"dbName":"reviews"}},"enums":{},"types":{}}');
async function decodeBase64AsWasm(wasmBase64) {
  const { Buffer: Buffer2 } = await import("buffer");
  const wasmArray = Buffer2.from(wasmBase64, "base64");
  return new WebAssembly.Module(wasmArray);
}
config.compilerWasm = {
  getRuntime: async () => await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs"),
  getQueryCompilerWasmModule: async () => {
    const { wasm } = await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.mjs");
    return await decodeBase64AsWasm(wasm);
  },
  importName: "./query_compiler_fast_bg.js"
};
function getPrismaClientClass() {
  return runtime.getPrismaClient(config);
}

// generated/prisma/internal/prismaNamespace.ts
var prismaNamespace_exports = {};
__export(prismaNamespace_exports, {
  AccountScalarFieldEnum: () => AccountScalarFieldEnum,
  AnyNull: () => AnyNull2,
  BookingScalarFieldEnum: () => BookingScalarFieldEnum,
  CategoryScalarFieldEnum: () => CategoryScalarFieldEnum,
  DbNull: () => DbNull2,
  Decimal: () => Decimal2,
  JsonNull: () => JsonNull2,
  ModelName: () => ModelName,
  NullTypes: () => NullTypes2,
  NullsOrder: () => NullsOrder,
  PaymentScalarFieldEnum: () => PaymentScalarFieldEnum,
  PrismaClientInitializationError: () => PrismaClientInitializationError2,
  PrismaClientKnownRequestError: () => PrismaClientKnownRequestError2,
  PrismaClientRustPanicError: () => PrismaClientRustPanicError2,
  PrismaClientUnknownRequestError: () => PrismaClientUnknownRequestError2,
  PrismaClientValidationError: () => PrismaClientValidationError2,
  QueryMode: () => QueryMode,
  ReviewScalarFieldEnum: () => ReviewScalarFieldEnum,
  SessionScalarFieldEnum: () => SessionScalarFieldEnum,
  SortOrder: () => SortOrder,
  Sql: () => Sql2,
  TransactionIsolationLevel: () => TransactionIsolationLevel,
  TutorAvailabilityScalarFieldEnum: () => TutorAvailabilityScalarFieldEnum,
  TutorCategoryScalarFieldEnum: () => TutorCategoryScalarFieldEnum,
  TutorProfileScalarFieldEnum: () => TutorProfileScalarFieldEnum,
  UserScalarFieldEnum: () => UserScalarFieldEnum,
  VerificationScalarFieldEnum: () => VerificationScalarFieldEnum,
  defineExtension: () => defineExtension,
  empty: () => empty2,
  getExtensionContext: () => getExtensionContext,
  join: () => join2,
  prismaVersion: () => prismaVersion,
  raw: () => raw2,
  sql: () => sql
});
import * as runtime2 from "@prisma/client/runtime/client";
var PrismaClientKnownRequestError2 = runtime2.PrismaClientKnownRequestError;
var PrismaClientUnknownRequestError2 = runtime2.PrismaClientUnknownRequestError;
var PrismaClientRustPanicError2 = runtime2.PrismaClientRustPanicError;
var PrismaClientInitializationError2 = runtime2.PrismaClientInitializationError;
var PrismaClientValidationError2 = runtime2.PrismaClientValidationError;
var sql = runtime2.sqltag;
var empty2 = runtime2.empty;
var join2 = runtime2.join;
var raw2 = runtime2.raw;
var Sql2 = runtime2.Sql;
var Decimal2 = runtime2.Decimal;
var getExtensionContext = runtime2.Extensions.getExtensionContext;
var prismaVersion = {
  client: "7.3.0",
  engine: "9d6ad21cbbceab97458517b147a6a09ff43aa735"
};
var NullTypes2 = {
  DbNull: runtime2.NullTypes.DbNull,
  JsonNull: runtime2.NullTypes.JsonNull,
  AnyNull: runtime2.NullTypes.AnyNull
};
var DbNull2 = runtime2.DbNull;
var JsonNull2 = runtime2.JsonNull;
var AnyNull2 = runtime2.AnyNull;
var ModelName = {
  User: "User",
  Session: "Session",
  Account: "Account",
  Verification: "Verification",
  TutorProfile: "TutorProfile",
  Category: "Category",
  TutorCategory: "TutorCategory",
  TutorAvailability: "TutorAvailability",
  Booking: "Booking",
  Payment: "Payment",
  Review: "Review"
};
var TransactionIsolationLevel = runtime2.makeStrictEnum({
  ReadUncommitted: "ReadUncommitted",
  ReadCommitted: "ReadCommitted",
  RepeatableRead: "RepeatableRead",
  Serializable: "Serializable"
});
var UserScalarFieldEnum = {
  id: "id",
  name: "name",
  email: "email",
  emailVerified: "emailVerified",
  image: "image",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  role: "role",
  phone: "phone",
  status: "status",
  stripeCustomerId: "stripeCustomerId"
};
var SessionScalarFieldEnum = {
  id: "id",
  expiresAt: "expiresAt",
  token: "token",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  ipAddress: "ipAddress",
  userAgent: "userAgent",
  userId: "userId"
};
var AccountScalarFieldEnum = {
  id: "id",
  accountId: "accountId",
  providerId: "providerId",
  userId: "userId",
  accessToken: "accessToken",
  refreshToken: "refreshToken",
  idToken: "idToken",
  accessTokenExpiresAt: "accessTokenExpiresAt",
  refreshTokenExpiresAt: "refreshTokenExpiresAt",
  scope: "scope",
  password: "password",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var VerificationScalarFieldEnum = {
  id: "id",
  identifier: "identifier",
  value: "value",
  expiresAt: "expiresAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var TutorProfileScalarFieldEnum = {
  id: "id",
  userId: "userId",
  bio: "bio",
  hourlyRate: "hourlyRate",
  experience: "experience",
  rating: "rating",
  totalReviews: "totalReviews",
  isAvailable: "isAvailable",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var CategoryScalarFieldEnum = {
  id: "id",
  name: "name",
  description: "description",
  icon: "icon",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var TutorCategoryScalarFieldEnum = {
  id: "id",
  tutorProfileId: "tutorProfileId",
  categoryId: "categoryId"
};
var TutorAvailabilityScalarFieldEnum = {
  id: "id",
  tutorProfileId: "tutorProfileId",
  dayOfWeek: "dayOfWeek",
  startTime: "startTime",
  endTime: "endTime",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var BookingScalarFieldEnum = {
  id: "id",
  studentId: "studentId",
  tutorProfileId: "tutorProfileId",
  scheduledAt: "scheduledAt",
  duration: "duration",
  amount: "amount",
  currency: "currency",
  status: "status",
  paymentStatus: "paymentStatus",
  stripeCheckoutSessionId: "stripeCheckoutSessionId",
  stripePaymentIntentId: "stripePaymentIntentId",
  paidAt: "paidAt",
  notes: "notes",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var PaymentScalarFieldEnum = {
  id: "id",
  bookingId: "bookingId",
  studentId: "studentId",
  amount: "amount",
  currency: "currency",
  status: "status",
  stripeCheckoutSessionId: "stripeCheckoutSessionId",
  stripePaymentIntentId: "stripePaymentIntentId",
  paidAt: "paidAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var ReviewScalarFieldEnum = {
  id: "id",
  rating: "rating",
  comment: "comment",
  studentId: "studentId",
  tutorProfileId: "tutorProfileId",
  bookingId: "bookingId",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var SortOrder = {
  asc: "asc",
  desc: "desc"
};
var QueryMode = {
  default: "default",
  insensitive: "insensitive"
};
var NullsOrder = {
  first: "first",
  last: "last"
};
var defineExtension = runtime2.Extensions.defineExtension;

// generated/prisma/enums.ts
var BookingStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED"
};
var PaymentStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED"
};

// generated/prisma/client.ts
globalThis["__dirname"] = path.dirname(fileURLToPath(import.meta.url));
var PrismaClient = getPrismaClientClass();

// src/lib/prisma.ts
var connectionString = `${process.env.DATABASE_URL}`;
var adapter = new PrismaPg({ connectionString });
var prisma = new PrismaClient({ adapter });

// src/lib/auth.ts
import nodemailer from "nodemailer";
var normalizeOrigin = (origin) => origin.trim().replace(/\/$/, "");
var trustedOrigins = Array.from(
  new Set(
    [
      process.env.APP_URL,
      process.env.CLIENT_URL,
      process.env.FRONTEND_URL,
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : void 0
    ].filter((value) => Boolean(value)).map(normalizeOrigin)
  )
);
var transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  // Use true for port 465, false for port 587
  auth: {
    user: process.env.APP_USER,
    pass: process.env.APP_PASS
  }
});
var auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql"
    // or "mysql", "postgresql", ...etc
  }),
  trustedOrigins,
  advanced: {
    crossOriginCookies: {
      enabled: process.env.NODE_ENV === "production"
    },
    defaultCookieAttributes: {
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      partitioned: process.env.NODE_ENV === "production"
      // Required for cross-origin cookies in modern browsers
    }
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "STUDENT",
        required: false
      },
      phone: {
        type: "string",
        required: false
      },
      status: {
        type: "string",
        defaultValue: "ACTIVE",
        required: false
      }
    }
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url, token }, request) => {
      try {
        const callbackURL = encodeURIComponent(
          `${process.env.APP_URL}/verify-email`
        );
        const verificationUrl = `${process.env.BACKEND_URL}/api/auth/verify-email?token=${token}&callbackURL=${callbackURL}`;
        const info = await transporter.sendMail({
          from: '"SkillBridge" <skillbridge@yopmail.com>',
          to: user.email,
          subject: "Please verify your email!",
          html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Email Verification</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      font-family: Arial, Helvetica, sans-serif;
    }

    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .header {
      background-color: #0f172a;
      color: #ffffff;
      padding: 20px;
      text-align: center;
    }

    .header h1 {
      margin: 0;
      font-size: 22px;
    }

    .content {
      padding: 30px;
      color: #334155;
      line-height: 1.6;
    }

    .content h2 {
      margin-top: 0;
      font-size: 20px;
      color: #0f172a;
    }

    .button-wrapper {
      text-align: center;
      margin: 30px 0;
    }

    .verify-button {
      background-color: #2563eb;
      color: #ffffff !important;
      padding: 14px 28px;
      text-decoration: none;
      font-weight: bold;
      border-radius: 6px;
      display: inline-block;
    }

    .verify-button:hover {
      background-color: #1d4ed8;
    }

    .footer {
      background-color: #f1f5f9;
      padding: 20px;
      text-align: center;
      font-size: 13px;
      color: #64748b;
    }

    .link {
      word-break: break-all;
      font-size: 13px;
      color: #2563eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>Skillbridge</h1>
    </div>

    <!-- Content -->
    <div class="content">
      <h2>Verify Your Email Address</h2>
      <p>
        Hello ${user.name} <br /><br />
        Thank you for registering on <strong>Skillbridge</strong>.
        Please confirm your email address to activate your account.
      </p>

      <div class="button-wrapper">
        <a href="${verificationUrl}" class="verify-button">
          Verify Email
        </a>
      </div>

      <p>
        If the button doesn\u2019t work, copy and paste the link below into your browser:
      </p>

      <p class="link">
        ${url}
      </p>

      <p>
        This verification link will expire soon for security reasons.
        If you did not create an account, you can safely ignore this email.
      </p>

      <p>
        Regards, <br />
        <strong>Skillbridge Team</strong>
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      \xA9 2025 Skillbridge. All rights reserved.
    </div>
  </div>
</body>
</html>
`
        });
        console.log("Message sent:", info.messageId);
      } catch (err) {
        console.error(err);
        throw err;
      }
    }
  }
  // socialProviders: {
  //   google: {
  //     prompt: "select_account consent",
  //     accessType: "offline",
  //     clientId: process.env.GOOGLE_CLIENT_ID as string,
  //     clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
  //   },
  // },
});

// src/app.ts
import cors from "cors";

// src/utils/ApiError.ts
var ApiError = class extends Error {
  statusCode;
  constructor(statusCode, message, stack = "") {
    super(message);
    this.statusCode = statusCode;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
};

// src/middlewares/globalErrorHandler.ts
function errorHandler(err, req, res, next) {
  let statusCode = 500;
  let errorMessage = "Internal Server Error";
  let errorDetails = err;
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    errorMessage = err.message;
  } else if (err instanceof prismaNamespace_exports.PrismaClientValidationError) {
    statusCode = 400;
    errorMessage = "You provide incorrect field type or missing fields!";
  } else if (err instanceof prismaNamespace_exports.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      statusCode = 400;
      errorMessage = "An operation failed because it depends on one or more records that were required but not found.";
    } else if (err.code === "P2002") {
      statusCode = 400;
      errorMessage = "Duplicate key error";
    } else if (err.code === "P2003") {
      statusCode = 400;
      errorMessage = "Foreign key constraint failed";
    }
  } else if (err instanceof prismaNamespace_exports.PrismaClientUnknownRequestError) {
    statusCode = 500;
    errorMessage = "Error occurred during query execution";
  } else if (err instanceof prismaNamespace_exports.PrismaClientInitializationError) {
    if (err.errorCode === "P1000") {
      statusCode = 401;
      errorMessage = "Authentication failed. Please check your creditials!";
    } else if (err.errorCode === "P1001") {
      statusCode = 400;
      errorMessage = "Can't reach database server";
    }
  }
  res.status(statusCode);
  res.json({
    message: errorMessage,
    error: errorDetails
  });
}
var globalErrorHandler_default = errorHandler;

// src/middlewares/notFound.ts
function notFound(req, res) {
  res.status(404).json({
    message: "Route not found!",
    path: req.originalUrl,
    date: Date()
  });
}

// src/routes/index.ts
import { Router as Router8 } from "express";

// src/modules/category/category.routes.ts
import { Router } from "express";

// src/utils/catchAsync.ts
var catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// src/utils/sendResponse.ts
var sendResponse = (res, options) => {
  const { statusCode, success, message, data, meta } = options;
  res.status(statusCode).json({
    success,
    message,
    meta,
    data
  });
};

// src/modules/category/category.service.ts
var getAllCategories = async () => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { tutors: true }
      }
    }
  });
  return categories;
};
var getCategoryById = async (id) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      tutors: {
        include: {
          tutorProfile: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true
                }
              }
            }
          }
        }
      }
    }
  });
  if (!category) {
    throw new ApiError(404, "Category not found");
  }
  return category;
};
var createCategory = async (data) => {
  const existingCategory = await prisma.category.findUnique({
    where: { name: data.name }
  });
  if (existingCategory) {
    throw new ApiError(400, "Category with this name already exists");
  }
  const category = await prisma.category.create({
    data
  });
  return category;
};
var updateCategory = async (id, data) => {
  const category = await prisma.category.findUnique({
    where: { id }
  });
  if (!category) {
    throw new ApiError(404, "Category not found");
  }
  if (data.name && data.name !== category.name) {
    const existingCategory = await prisma.category.findUnique({
      where: { name: data.name }
    });
    if (existingCategory) {
      throw new ApiError(400, "Category with this name already exists");
    }
  }
  const updatedCategory = await prisma.category.update({
    where: { id },
    data
  });
  return updatedCategory;
};
var deleteCategory = async (id) => {
  const category = await prisma.category.findUnique({
    where: { id }
  });
  if (!category) {
    throw new ApiError(404, "Category not found");
  }
  await prisma.category.delete({
    where: { id }
  });
  return null;
};
var CategoryService = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};

// src/modules/category/category.controller.ts
var getAllCategories2 = catchAsync(async (req, res) => {
  const categories = await CategoryService.getAllCategories();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Categories retrieved successfully",
    data: categories
  });
});
var getCategoryById2 = catchAsync(async (req, res) => {
  const id = req.params.id;
  const category = await CategoryService.getCategoryById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Category retrieved successfully",
    data: category
  });
});
var createCategory2 = catchAsync(async (req, res) => {
  const category = await CategoryService.createCategory(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Category created successfully",
    data: category
  });
});
var updateCategory2 = catchAsync(async (req, res) => {
  const id = req.params.id;
  const category = await CategoryService.updateCategory(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Category updated successfully",
    data: category
  });
});
var deleteCategory2 = catchAsync(async (req, res) => {
  const id = req.params.id;
  await CategoryService.deleteCategory(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Category deleted successfully",
    data: null
  });
});
var CategoryController = {
  getAllCategories: getAllCategories2,
  getCategoryById: getCategoryById2,
  createCategory: createCategory2,
  updateCategory: updateCategory2,
  deleteCategory: deleteCategory2
};

// src/middlewares/auth.ts
var auth2 = (...roles) => {
  return async (req, res, next) => {
    try {
      const session = await auth.api.getSession({
        headers: req.headers
      });
      if (!session) {
        return res.status(401).json({
          success: false,
          message: "You are not authorized!"
        });
      }
      if (!session.user.emailVerified) {
        return res.status(403).json({
          success: false,
          message: "Email verification required. Please verfiy your email!"
        });
      }
      req.user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        emailVerified: session.user.emailVerified
      };
      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden! You don't have permission to access this resources!"
        });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};
var auth_default = auth2;

// src/modules/category/category.routes.ts
var router = Router();
router.get("/", CategoryController.getAllCategories);
router.get("/:id", CategoryController.getCategoryById);
router.post("/", auth_default("ADMIN" /* ADMIN */), CategoryController.createCategory);
router.put("/:id", auth_default("ADMIN" /* ADMIN */), CategoryController.updateCategory);
router.delete("/:id", auth_default("ADMIN" /* ADMIN */), CategoryController.deleteCategory);
var categoryRoutes = router;

// src/modules/tutor/tutor.routes.ts
import { Router as Router2 } from "express";

// src/modules/tutor/tutor.service.ts
var getAllTutors = async (filters) => {
  const {
    search,
    categoryId,
    minPrice,
    maxPrice,
    minRating,
    isAvailable,
    page = 1,
    limit = 10,
    sortBy = "rating",
    sortOrder = "desc"
  } = filters;
  const skip = (page - 1) * limit;
  const where = {};
  if (search) {
    where.OR = [
      { user: { name: { contains: search, mode: "insensitive" } } },
      { bio: { contains: search, mode: "insensitive" } }
    ];
  }
  if (categoryId) {
    where.categories = {
      some: { categoryId }
    };
  }
  if (minPrice !== void 0 || maxPrice !== void 0) {
    where.hourlyRate = {};
    if (minPrice !== void 0) where.hourlyRate.gte = minPrice;
    if (maxPrice !== void 0) where.hourlyRate.lte = maxPrice;
  }
  if (minRating !== void 0) {
    where.rating = { gte: minRating };
  }
  if (isAvailable !== void 0) {
    where.isAvailable = isAvailable;
  }
  const orderBy = {};
  if (sortBy === "price") {
    orderBy.hourlyRate = sortOrder;
  } else if (sortBy === "experience") {
    orderBy.experience = sortOrder;
  } else {
    orderBy.rating = sortOrder;
  }
  const [tutors, total] = await Promise.all([
    prisma.tutorProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        categories: {
          include: {
            category: true
          }
        },
        availabilities: true,
        _count: {
          select: { reviews: true, bookings: true }
        }
      }
    }),
    prisma.tutorProfile.count({ where })
  ]);
  return {
    tutors,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};
var getTutorById = async (id) => {
  const tutor = await prisma.tutorProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          phone: true
        }
      },
      categories: {
        include: {
          category: true
        }
      },
      availabilities: {
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }]
      },
      reviews: {
        include: {
          student: {
            select: {
              id: true,
              name: true,
              image: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 10
      }
    }
  });
  if (!tutor) {
    throw new ApiError(404, "Tutor not found");
  }
  return tutor;
};
var createTutorProfile = async (userId, data) => {
  const existingProfile = await prisma.tutorProfile.findUnique({
    where: { userId }
  });
  if (existingProfile) {
    throw new ApiError(400, "You already have a tutor profile");
  }
  const { categoryIds, ...profileData } = data;
  const createData = {
    ...profileData,
    userId
  };
  if (categoryIds && categoryIds.length > 0) {
    createData.categories = {
      create: categoryIds.map((categoryId) => ({
        categoryId
      }))
    };
  }
  const tutorProfile = await prisma.tutorProfile.create({
    data: createData,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      },
      categories: {
        include: {
          category: true
        }
      }
    }
  });
  await prisma.user.update({
    where: { id: userId },
    data: { role: "TUTOR" }
  });
  return tutorProfile;
};
var updateTutorProfile = async (userId, data) => {
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId }
  });
  if (!tutorProfile) {
    throw new ApiError(404, "Tutor profile not found");
  }
  const { categoryIds, ...profileData } = data;
  if (categoryIds) {
    await prisma.tutorCategory.deleteMany({
      where: { tutorProfileId: tutorProfile.id }
    });
    await prisma.tutorCategory.createMany({
      data: categoryIds.map((categoryId) => ({
        tutorProfileId: tutorProfile.id,
        categoryId
      }))
    });
  }
  const updatedProfile = await prisma.tutorProfile.update({
    where: { userId },
    data: profileData,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      },
      categories: {
        include: {
          category: true
        }
      },
      availabilities: true
    }
  });
  return updatedProfile;
};
var updateAvailability = async (userId, availabilities) => {
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId }
  });
  if (!tutorProfile) {
    throw new ApiError(404, "Tutor profile not found");
  }
  await prisma.tutorAvailability.deleteMany({
    where: { tutorProfileId: tutorProfile.id }
  });
  await prisma.tutorAvailability.createMany({
    data: availabilities.map((a) => ({
      ...a,
      tutorProfileId: tutorProfile.id
    }))
  });
  const updatedProfile = await prisma.tutorProfile.findUnique({
    where: { userId },
    include: {
      availabilities: {
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }]
      }
    }
  });
  return updatedProfile;
};
var getMyProfile = async (userId) => {
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          phone: true
        }
      },
      categories: {
        include: {
          category: true
        }
      },
      availabilities: {
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }]
      },
      _count: {
        select: { reviews: true, bookings: true }
      }
    }
  });
  if (!tutorProfile) {
    throw new ApiError(404, "Tutor profile not found");
  }
  return tutorProfile;
};
var getMyBookings = async (userId, filters) => {
  const { status, page = 1, limit = 10 } = filters;
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId }
  });
  if (!tutorProfile) {
    throw new ApiError(404, "Tutor profile not found");
  }
  const skip = (page - 1) * limit;
  const where = {
    tutorProfileId: tutorProfile.id
  };
  if (status) {
    where.status = status;
  }
  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip,
      take: limit,
      orderBy: { scheduledAt: "desc" },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        review: true
      }
    }),
    prisma.booking.count({ where })
  ]);
  return {
    bookings,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};
var TutorService = {
  getAllTutors,
  getTutorById,
  createTutorProfile,
  updateTutorProfile,
  updateAvailability,
  getMyProfile,
  getMyBookings
};

// src/modules/tutor/tutor.controller.ts
var getAllTutors2 = catchAsync(async (req, res) => {
  const {
    search,
    categoryId,
    minPrice,
    maxPrice,
    minRating,
    isAvailable,
    page,
    limit,
    sortBy,
    sortOrder
  } = req.query;
  const filters = {};
  if (search) filters.search = search;
  if (categoryId) filters.categoryId = categoryId;
  if (minPrice) filters.minPrice = Number(minPrice);
  if (maxPrice) filters.maxPrice = Number(maxPrice);
  if (minRating) filters.minRating = Number(minRating);
  if (isAvailable !== void 0) filters.isAvailable = isAvailable === "true";
  if (page) filters.page = Number(page);
  if (limit) filters.limit = Number(limit);
  if (sortBy) filters.sortBy = sortBy;
  if (sortOrder) filters.sortOrder = sortOrder;
  const result = await TutorService.getAllTutors(filters);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Tutors retrieved successfully",
    data: result.tutors,
    meta: result.meta
  });
});
var getTutorById2 = catchAsync(async (req, res) => {
  const id = req.params.id;
  const tutor = await TutorService.getTutorById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Tutor retrieved successfully",
    data: tutor
  });
});
var createTutorProfile2 = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const tutor = await TutorService.createTutorProfile(userId, req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Tutor profile created successfully",
    data: tutor
  });
});
var updateTutorProfile2 = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const tutor = await TutorService.updateTutorProfile(userId, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Tutor profile updated successfully",
    data: tutor
  });
});
var updateAvailability2 = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { availabilities } = req.body;
  const tutor = await TutorService.updateAvailability(userId, availabilities);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Availability updated successfully",
    data: tutor
  });
});
var getMyProfile2 = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const tutor = await TutorService.getMyProfile(userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Tutor profile retrieved successfully",
    data: tutor
  });
});
var getMyBookings2 = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { status, page, limit } = req.query;
  const filters = {};
  if (status) filters.status = status;
  if (page) filters.page = Number(page);
  if (limit) filters.limit = Number(limit);
  const result = await TutorService.getMyBookings(userId, filters);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Bookings retrieved successfully",
    data: result.bookings,
    meta: result.meta
  });
});
var TutorController = {
  getAllTutors: getAllTutors2,
  getTutorById: getTutorById2,
  createTutorProfile: createTutorProfile2,
  updateTutorProfile: updateTutorProfile2,
  updateAvailability: updateAvailability2,
  getMyProfile: getMyProfile2,
  getMyBookings: getMyBookings2
};

// src/modules/tutor/tutor.routes.ts
var router2 = Router2();
router2.get("/", TutorController.getAllTutors);
router2.get("/:id", TutorController.getTutorById);
router2.post(
  "/profile",
  auth_default("STUDENT" /* STUDENT */, "TUTOR" /* TUTOR */, "ADMIN" /* ADMIN */),
  TutorController.createTutorProfile
);
router2.get("/me/profile", auth_default("TUTOR" /* TUTOR */), TutorController.getMyProfile);
router2.put(
  "/me/profile",
  auth_default("TUTOR" /* TUTOR */),
  TutorController.updateTutorProfile
);
router2.put(
  "/me/availability",
  auth_default("TUTOR" /* TUTOR */),
  TutorController.updateAvailability
);
router2.get("/me/bookings", auth_default("TUTOR" /* TUTOR */), TutorController.getMyBookings);
var tutorRoutes = router2;

// src/modules/booking/booking.routes.ts
import { Router as Router3 } from "express";

// src/config/index.ts
import dotenv from "dotenv";
import path2 from "path";
dotenv.config({ path: path2.join(process.cwd(), ".env") });
var normalizeUrl = (url) => url.trim().replace(/\/$/, "");
var frontendUrl = normalizeUrl(
  process.env.CLIENT_URL || process.env.FRONTEND_URL || process.env.APP_URL || "http://localhost:3000"
);
var config2 = {
  node_env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10),
  database_url: process.env.DATABASE_URL,
  jwt: {
    secret: process.env.JWT_SECRET || "fallback-secret-change-in-production",
    expires_in: process.env.JWT_EXPIRES_IN || "7d"
  },
  client_url: process.env.CLIENT_URL || "http://localhost:3000",
  app_url: process.env.APP_URL || "http://localhost:3000",
  frontend_url: frontendUrl,
  stripe: {
    secret_key: process.env.STRIPE_SECRET_KEY,
    webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
    currency: process.env.STRIPE_CURRENCY || "usd"
  },
  bcrypt_salt_rounds: 12
};

// src/modules/booking/booking.service.ts
var createBooking = async (studentId, data) => {
  const { tutorProfileId, scheduledAt, duration = 60, notes } = data;
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { id: tutorProfileId },
    include: {
      user: true,
      availabilities: true
    }
  });
  if (!tutorProfile) {
    throw new ApiError(404, "Tutor not found");
  }
  if (!tutorProfile.isAvailable) {
    throw new ApiError(400, "Tutor is not available for bookings");
  }
  if (tutorProfile.userId === studentId) {
    throw new ApiError(400, "You cannot book a session with yourself");
  }
  const scheduledDate = new Date(scheduledAt);
  if (scheduledDate <= /* @__PURE__ */ new Date()) {
    throw new ApiError(400, "Scheduled time must be in the future");
  }
  const dayOfWeek = scheduledDate.getDay();
  const time = scheduledDate.toTimeString().slice(0, 5);
  const availableSlot = tutorProfile.availabilities.find(
    (a) => a.dayOfWeek === dayOfWeek && a.startTime <= time && a.endTime >= time
  );
  if (!availableSlot) {
    throw new ApiError(400, "Tutor is not available at the selected time");
  }
  const endTime = new Date(scheduledDate.getTime() + duration * 6e4);
  const conflictingBooking = await prisma.booking.findFirst({
    where: {
      tutorProfileId,
      status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      scheduledAt: {
        gte: new Date(scheduledDate.getTime() - duration * 6e4),
        lt: endTime
      }
    }
  });
  if (conflictingBooking) {
    throw new ApiError(400, "Tutor already has a booking at this time");
  }
  const amount = Math.round(tutorProfile.hourlyRate * duration * 100 / 60);
  const booking = await prisma.booking.create({
    data: {
      studentId,
      tutorProfileId,
      scheduledAt: scheduledDate,
      duration,
      amount,
      currency: config2.stripe.currency,
      notes: notes ?? null,
      status: BookingStatus.PENDING
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      },
      tutorProfile: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        }
      }
    }
  });
  return booking;
};
var getMyBookings3 = async (userId, userRole, filters) => {
  const { status, page = 1, limit = 10 } = filters;
  const skip = (page - 1) * limit;
  let where = {};
  if (userRole === "TUTOR") {
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId }
    });
    if (tutorProfile) {
      where.tutorProfileId = tutorProfile.id;
    } else {
      where.studentId = userId;
    }
  } else {
    where.studentId = userId;
  }
  if (status) {
    const statusValues = status.split(",").map((s) => s.trim());
    if (statusValues.length > 1) {
      where.status = { in: statusValues };
    } else {
      where.status = statusValues[0];
    }
  }
  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip,
      take: limit,
      orderBy: { scheduledAt: "desc" },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        tutorProfile: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        },
        review: true
      }
    }),
    prisma.booking.count({ where })
  ]);
  return {
    bookings,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};
var getBookingById = async (id, userId, userRole) => {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          phone: true
        }
      },
      tutorProfile: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              phone: true
            }
          }
        }
      },
      review: true
    }
  });
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }
  if (userRole !== "ADMIN") {
    const isStudent = booking.studentId === userId;
    const isTutor = booking.tutorProfile.userId === userId;
    if (!isStudent && !isTutor) {
      throw new ApiError(403, "You are not authorized to view this booking");
    }
  }
  return booking;
};
var updateBookingStatus = async (id, userId, userRole, status) => {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      tutorProfile: true
    }
  });
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }
  const isStudent = booking.studentId === userId;
  const isTutor = booking.tutorProfile.userId === userId;
  const isAdmin = userRole === "ADMIN";
  if (!isStudent && !isTutor && !isAdmin) {
    throw new ApiError(403, "You are not authorized to update this booking");
  }
  if (booking.status === BookingStatus.CANCELLED) {
    throw new ApiError(400, "Cannot update a cancelled booking");
  }
  if (booking.status === BookingStatus.COMPLETED) {
    throw new ApiError(400, "Cannot update a completed booking");
  }
  if ((status === BookingStatus.CONFIRMED || status === BookingStatus.COMPLETED) && booking.paymentStatus !== PaymentStatus.PAID) {
    throw new ApiError(
      400,
      "Booking can only be confirmed or completed after payment is completed"
    );
  }
  if (status === BookingStatus.COMPLETED && booking.status !== BookingStatus.CONFIRMED) {
    throw new ApiError(
      400,
      "Booking can only be completed after it is confirmed"
    );
  }
  if (isStudent && !isAdmin && status !== BookingStatus.CANCELLED) {
    throw new ApiError(400, "Students can only cancel bookings");
  }
  if (isTutor && !isAdmin) {
    const allowedStatuses = [
      BookingStatus.CONFIRMED,
      BookingStatus.COMPLETED,
      BookingStatus.CANCELLED
    ];
    if (!allowedStatuses.includes(status)) {
      throw new ApiError(400, "Invalid status transition for tutor");
    }
  }
  const updatedBooking = await prisma.booking.update({
    where: { id },
    data: { status },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      },
      tutorProfile: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        }
      }
    }
  });
  return updatedBooking;
};
var cancelBooking = async (id, userId, userRole) => {
  return updateBookingStatus(id, userId, userRole, BookingStatus.CANCELLED);
};
var confirmBooking = async (id, userId, userRole) => {
  return updateBookingStatus(id, userId, userRole, BookingStatus.CONFIRMED);
};
var completeBooking = async (id, userId, userRole) => {
  return updateBookingStatus(id, userId, userRole, BookingStatus.COMPLETED);
};
var updateStatus = async (id, status) => {
  if (!Object.values(BookingStatus).includes(status)) {
    throw new ApiError(400, `Invalid status: ${status}`);
  }
  const booking = await prisma.booking.findUnique({
    where: { id }
  });
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }
  const nextStatus = status;
  if ((nextStatus === BookingStatus.CONFIRMED || nextStatus === BookingStatus.COMPLETED) && booking.paymentStatus !== PaymentStatus.PAID) {
    throw new ApiError(
      400,
      "Booking can only be confirmed or completed after payment is completed"
    );
  }
  if (nextStatus === BookingStatus.COMPLETED && booking.status !== BookingStatus.CONFIRMED) {
    throw new ApiError(
      400,
      "Booking can only be completed after it is confirmed"
    );
  }
  const updatedBooking = await prisma.booking.update({
    where: { id },
    data: { status: nextStatus },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      },
      tutorProfile: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        }
      }
    }
  });
  return updatedBooking;
};
var BookingService = {
  createBooking,
  getMyBookings: getMyBookings3,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  confirmBooking,
  completeBooking,
  updateStatus
};

// src/modules/booking/booking.controller.ts
var createBooking2 = catchAsync(async (req, res) => {
  const studentId = req.user.id;
  const booking = await BookingService.createBooking(studentId, req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Booking created successfully",
    data: booking
  });
});
var getMyBookings4 = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  const { status, page, limit } = req.query;
  const filters = {};
  if (status) filters.status = status;
  if (page) filters.page = Number(page);
  if (limit) filters.limit = Number(limit);
  const result = await BookingService.getMyBookings(userId, userRole, filters);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Bookings retrieved successfully",
    data: result.bookings,
    meta: result.meta
  });
});
var getBookingById2 = catchAsync(async (req, res) => {
  const id = req.params.id;
  const userId = req.user.id;
  const userRole = req.user.role;
  const booking = await BookingService.getBookingById(id, userId, userRole);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Booking retrieved successfully",
    data: booking
  });
});
var cancelBooking2 = catchAsync(async (req, res) => {
  const id = req.params.id;
  const userId = req.user.id;
  const userRole = req.user.role;
  const booking = await BookingService.cancelBooking(id, userId, userRole);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Booking cancelled successfully",
    data: booking
  });
});
var confirmBooking2 = catchAsync(async (req, res) => {
  const id = req.params.id;
  const userId = req.user.id;
  const userRole = req.user.role;
  const booking = await BookingService.confirmBooking(id, userId, userRole);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Booking confirmed successfully",
    data: booking
  });
});
var completeBooking2 = catchAsync(async (req, res) => {
  const id = req.params.id;
  const userId = req.user.id;
  const userRole = req.user.role;
  const booking = await BookingService.completeBooking(id, userId, userRole);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Booking marked as completed",
    data: booking
  });
});
var updateStatus2 = catchAsync(async (req, res) => {
  const id = req.params.id;
  const { status } = req.body;
  const booking = await BookingService.updateStatus(id, status);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `Booking status updated to ${status}`,
    data: booking
  });
});
var BookingController = {
  createBooking: createBooking2,
  getMyBookings: getMyBookings4,
  getBookingById: getBookingById2,
  cancelBooking: cancelBooking2,
  confirmBooking: confirmBooking2,
  completeBooking: completeBooking2,
  updateStatus: updateStatus2
};

// src/modules/booking/booking.routes.ts
var router3 = Router3();
router3.use(auth_default("STUDENT" /* STUDENT */, "TUTOR" /* TUTOR */, "ADMIN" /* ADMIN */));
router3.post("/", BookingController.createBooking);
router3.get("/", BookingController.getMyBookings);
router3.get("/:id", BookingController.getBookingById);
router3.patch("/:id/cancel", BookingController.cancelBooking);
router3.patch(
  "/:id/complete",
  auth_default("TUTOR" /* TUTOR */, "ADMIN" /* ADMIN */),
  BookingController.completeBooking
);
router3.patch(
  "/:id/confirm",
  auth_default("TUTOR" /* TUTOR */, "ADMIN" /* ADMIN */),
  BookingController.confirmBooking
);
router3.patch(
  "/:id/status",
  auth_default("ADMIN" /* ADMIN */),
  BookingController.updateStatus
);
var bookingRoutes = router3;

// src/modules/review/review.routes.ts
import { Router as Router4 } from "express";

// src/modules/review/review.service.ts
var createReview = async (studentId, data) => {
  const { bookingId, rating, comment } = data;
  if (rating < 1 || rating > 5) {
    throw new ApiError(400, "Rating must be between 1 and 5");
  }
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      tutorProfile: true,
      review: true
    }
  });
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }
  if (booking.studentId !== studentId) {
    throw new ApiError(403, "You can only review your own bookings");
  }
  if (booking.status !== BookingStatus.COMPLETED) {
    throw new ApiError(400, "You can only review completed sessions");
  }
  if (booking.review) {
    throw new ApiError(400, "You have already reviewed this session");
  }
  const review = await prisma.review.create({
    data: {
      rating,
      comment: comment ?? null,
      studentId,
      tutorProfileId: booking.tutorProfileId,
      bookingId
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          image: true
        }
      },
      tutorProfile: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true
            }
          }
        }
      }
    }
  });
  const tutorReviews = await prisma.review.findMany({
    where: { tutorProfileId: booking.tutorProfileId },
    select: { rating: true }
  });
  const totalRating = tutorReviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = totalRating / tutorReviews.length;
  await prisma.tutorProfile.update({
    where: { id: booking.tutorProfileId },
    data: {
      rating: averageRating,
      totalReviews: tutorReviews.length
    }
  });
  return review;
};
var getTutorReviews = async (tutorProfileId, filters) => {
  const { page = 1, limit = 10 } = filters;
  const skip = (page - 1) * limit;
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { id: tutorProfileId }
  });
  if (!tutorProfile) {
    throw new ApiError(404, "Tutor not found");
  }
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { tutorProfileId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    }),
    prisma.review.count({ where: { tutorProfileId } })
  ]);
  return {
    reviews,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};
var getMyReviews = async (studentId, filters) => {
  const { page = 1, limit = 10 } = filters;
  const skip = (page - 1) * limit;
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { studentId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        tutorProfile: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        }
      }
    }),
    prisma.review.count({ where: { studentId } })
  ]);
  return {
    reviews,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};
var updateReview = async (id, studentId, data) => {
  const review = await prisma.review.findUnique({
    where: { id }
  });
  if (!review) {
    throw new ApiError(404, "Review not found");
  }
  if (review.studentId !== studentId) {
    throw new ApiError(403, "You can only update your own reviews");
  }
  const hoursSinceCreation = (Date.now() - review.createdAt.getTime()) / (1e3 * 60 * 60);
  if (hoursSinceCreation > 24) {
    throw new ApiError(400, "You can only edit reviews within 24 hours");
  }
  if (data.rating && (data.rating < 1 || data.rating > 5)) {
    throw new ApiError(400, "Rating must be between 1 and 5");
  }
  const updatedReview = await prisma.review.update({
    where: { id },
    data,
    include: {
      student: {
        select: {
          id: true,
          name: true,
          image: true
        }
      }
    }
  });
  const tutorReviews = await prisma.review.findMany({
    where: { tutorProfileId: review.tutorProfileId },
    select: { rating: true }
  });
  const totalRating = tutorReviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = totalRating / tutorReviews.length;
  await prisma.tutorProfile.update({
    where: { id: review.tutorProfileId },
    data: { rating: averageRating }
  });
  return updatedReview;
};
var deleteReview = async (id) => {
  const review = await prisma.review.findUnique({
    where: { id }
  });
  if (!review) {
    throw new ApiError(404, "Review not found");
  }
  await prisma.review.delete({
    where: { id }
  });
  const tutorReviews = await prisma.review.findMany({
    where: { tutorProfileId: review.tutorProfileId },
    select: { rating: true }
  });
  if (tutorReviews.length > 0) {
    const totalRating = tutorReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / tutorReviews.length;
    await prisma.tutorProfile.update({
      where: { id: review.tutorProfileId },
      data: {
        rating: averageRating,
        totalReviews: tutorReviews.length
      }
    });
  } else {
    await prisma.tutorProfile.update({
      where: { id: review.tutorProfileId },
      data: {
        rating: 0,
        totalReviews: 0
      }
    });
  }
  return null;
};
var ReviewService = {
  createReview,
  getTutorReviews,
  getMyReviews,
  updateReview,
  deleteReview
};

// src/modules/review/review.controller.ts
var createReview2 = catchAsync(async (req, res) => {
  const studentId = req.user.id;
  const review = await ReviewService.createReview(studentId, req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Review created successfully",
    data: review
  });
});
var getTutorReviews2 = catchAsync(async (req, res) => {
  const tutorProfileId = req.params.tutorProfileId;
  const { page, limit } = req.query;
  const filters = {};
  if (page) filters.page = Number(page);
  if (limit) filters.limit = Number(limit);
  const result = await ReviewService.getTutorReviews(tutorProfileId, filters);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Reviews retrieved successfully",
    data: result.reviews,
    meta: result.meta
  });
});
var getMyReviews2 = catchAsync(async (req, res) => {
  const studentId = req.user.id;
  const { page, limit } = req.query;
  const filters = {};
  if (page) filters.page = Number(page);
  if (limit) filters.limit = Number(limit);
  const result = await ReviewService.getMyReviews(studentId, filters);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Reviews retrieved successfully",
    data: result.reviews,
    meta: result.meta
  });
});
var updateReview2 = catchAsync(async (req, res) => {
  const id = req.params.id;
  const studentId = req.user.id;
  const review = await ReviewService.updateReview(id, studentId, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Review updated successfully",
    data: review
  });
});
var deleteReview2 = catchAsync(async (req, res) => {
  const id = req.params.id;
  await ReviewService.deleteReview(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Review deleted successfully",
    data: null
  });
});
var ReviewController = {
  createReview: createReview2,
  getTutorReviews: getTutorReviews2,
  getMyReviews: getMyReviews2,
  updateReview: updateReview2,
  deleteReview: deleteReview2
};

// src/modules/review/review.routes.ts
var router4 = Router4();
router4.get("/tutor/:tutorProfileId", ReviewController.getTutorReviews);
router4.post(
  "/",
  auth_default("STUDENT" /* STUDENT */, "TUTOR" /* TUTOR */, "ADMIN" /* ADMIN */),
  ReviewController.createReview
);
router4.put(
  "/:id",
  auth_default("STUDENT" /* STUDENT */, "TUTOR" /* TUTOR */, "ADMIN" /* ADMIN */),
  ReviewController.updateReview
);
router4.get(
  "/me",
  auth_default("STUDENT" /* STUDENT */, "TUTOR" /* TUTOR */, "ADMIN" /* ADMIN */),
  ReviewController.getMyReviews
);
router4.delete("/:id", auth_default("ADMIN" /* ADMIN */), ReviewController.deleteReview);
var reviewRoutes = router4;

// src/modules/admin/admin.routes.ts
import { Router as Router5 } from "express";

// src/modules/admin/admin.service.ts
var getAllUsers = async (filters) => {
  const { search, role, status, page = 1, limit = 10 } = filters;
  const skip = (page - 1) * limit;
  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } }
    ];
  }
  if (role) {
    where.role = role;
  }
  if (status) {
    where.status = status;
  }
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        status: true,
        emailVerified: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        tutorProfile: {
          select: {
            id: true,
            rating: true,
            totalReviews: true,
            isAvailable: true
          }
        },
        _count: {
          select: {
            bookings: true,
            reviews: true
          }
        }
      }
    }),
    prisma.user.count({ where })
  ]);
  return {
    users,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};
var getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      status: true,
      emailVerified: true,
      phone: true,
      createdAt: true,
      updatedAt: true,
      tutorProfile: {
        include: {
          categories: {
            include: { category: true }
          },
          _count: {
            select: { bookings: true, reviews: true }
          }
        }
      },
      bookings: {
        take: 5,
        orderBy: { createdAt: "desc" }
      },
      reviews: {
        take: 5,
        orderBy: { createdAt: "desc" }
      }
    }
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return user;
};
var updateUserStatus = async (id, status) => {
  const user = await prisma.user.findUnique({
    where: { id }
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  if (user.role === "ADMIN") {
    throw new ApiError(400, "Cannot modify admin user status");
  }
  const updatedUser = await prisma.user.update({
    where: { id },
    data: { status },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true
    }
  });
  return updatedUser;
};
var updateUserRole = async (id, role) => {
  const user = await prisma.user.findUnique({
    where: { id }
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  if (user.role === "ADMIN") {
    throw new ApiError(400, "Cannot modify admin user role");
  }
  const updatedUser = await prisma.user.update({
    where: { id },
    data: { role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true
    }
  });
  return updatedUser;
};
var getAllBookings = async (filters) => {
  const { status, page = 1, limit = 10 } = filters;
  const skip = (page - 1) * limit;
  const where = {};
  if (status) {
    where.status = status;
  }
  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        tutorProfile: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        },
        review: true
      }
    }),
    prisma.booking.count({ where })
  ]);
  return {
    bookings,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};
var getDashboardStats = async () => {
  const [
    totalUsers,
    totalTutors,
    totalStudents,
    totalBookings,
    pendingBookings,
    completedBookings,
    totalCategories,
    totalReviews
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "TUTOR" } }),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.booking.count({ where: { status: "COMPLETED" } }),
    prisma.category.count(),
    prisma.review.count()
  ]);
  const recentBookings = await prisma.booking.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      student: {
        select: { name: true, email: true }
      },
      tutorProfile: {
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      }
    }
  });
  const topTutors = await prisma.tutorProfile.findMany({
    take: 5,
    orderBy: { rating: "desc" },
    where: { totalReviews: { gt: 0 } },
    include: {
      user: {
        select: { name: true, email: true, image: true }
      }
    }
  });
  return {
    stats: {
      totalUsers,
      totalTutors,
      totalStudents,
      totalBookings,
      pendingBookings,
      completedBookings,
      totalCategories,
      totalReviews
    },
    recentBookings,
    topTutors
  };
};
var AdminService = {
  getAllUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  getAllBookings,
  getDashboardStats
};

// src/modules/admin/admin.controller.ts
var getAllUsers2 = catchAsync(async (req, res) => {
  const { search, role, status, page, limit } = req.query;
  const filters = {};
  if (search) filters.search = search;
  if (role) filters.role = role;
  if (status) filters.status = status;
  if (page) filters.page = Number(page);
  if (limit) filters.limit = Number(limit);
  const result = await AdminService.getAllUsers(filters);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Users retrieved successfully",
    data: result.users,
    meta: result.meta
  });
});
var getUserById2 = catchAsync(async (req, res) => {
  const id = req.params.id;
  const user = await AdminService.getUserById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User retrieved successfully",
    data: user
  });
});
var updateUserStatus2 = catchAsync(async (req, res) => {
  const id = req.params.id;
  const { status } = req.body;
  const user = await AdminService.updateUserStatus(id, status);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User status updated successfully",
    data: user
  });
});
var updateUserRole2 = catchAsync(async (req, res) => {
  const id = req.params.id;
  const { role } = req.body;
  const user = await AdminService.updateUserRole(id, role);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User role updated successfully",
    data: user
  });
});
var getAllBookings2 = catchAsync(async (req, res) => {
  const { status, page, limit } = req.query;
  const filters = {};
  if (status) filters.status = status;
  if (page) filters.page = Number(page);
  if (limit) filters.limit = Number(limit);
  const result = await AdminService.getAllBookings(filters);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Bookings retrieved successfully",
    data: result.bookings,
    meta: result.meta
  });
});
var getDashboardStats2 = catchAsync(async (req, res) => {
  const stats = await AdminService.getDashboardStats();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Dashboard stats retrieved successfully",
    data: stats
  });
});
var AdminController = {
  getAllUsers: getAllUsers2,
  getUserById: getUserById2,
  updateUserStatus: updateUserStatus2,
  updateUserRole: updateUserRole2,
  getAllBookings: getAllBookings2,
  getDashboardStats: getDashboardStats2
};

// src/modules/admin/admin.routes.ts
var router5 = Router5();
router5.use(auth_default("ADMIN" /* ADMIN */));
router5.get("/dashboard", AdminController.getDashboardStats);
router5.get("/users", AdminController.getAllUsers);
router5.get("/users/:id", AdminController.getUserById);
router5.patch("/users/:id/role", AdminController.updateUserRole);
router5.patch("/users/:id/status", AdminController.updateUserStatus);
router5.get("/bookings", AdminController.getAllBookings);
var adminRoutes = router5;

// src/modules/user/user.routes.ts
import { Router as Router6 } from "express";

// src/modules/user/user.service.ts
var getMyProfile3 = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      status: true,
      emailVerified: true,
      phone: true,
      createdAt: true,
      updatedAt: true,
      tutorProfile: {
        include: {
          categories: {
            include: { category: true }
          },
          _count: {
            select: { bookings: true, reviews: true }
          }
        }
      },
      _count: {
        select: {
          bookings: true,
          reviews: true
        }
      }
    }
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return user;
};
var updateProfile = async (userId, data) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      status: true,
      phone: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true
    }
  });
  return updatedUser;
};
var getDashboard = async (userId, userRole) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true
    }
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  let dashboardData = { user };
  if (userRole === "TUTOR") {
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId },
      include: {
        _count: {
          select: { bookings: true, reviews: true }
        }
      }
    });
    if (tutorProfile) {
      const upcomingSessions = await prisma.booking.findMany({
        where: {
          tutorProfileId: tutorProfile.id,
          status: { in: ["PENDING", "CONFIRMED"] },
          scheduledAt: { gte: /* @__PURE__ */ new Date() }
        },
        take: 5,
        orderBy: { scheduledAt: "asc" },
        include: {
          student: {
            select: { name: true, email: true, image: true }
          }
        }
      });
      const recentReviews = await prisma.review.findMany({
        where: { tutorProfileId: tutorProfile.id },
        take: 3,
        orderBy: { createdAt: "desc" },
        include: {
          student: {
            select: { name: true, image: true }
          }
        }
      });
      dashboardData = {
        ...dashboardData,
        tutorProfile: {
          rating: tutorProfile.rating,
          totalReviews: tutorProfile.totalReviews,
          totalBookings: tutorProfile._count.bookings,
          isAvailable: tutorProfile.isAvailable
        },
        upcomingSessions,
        recentReviews
      };
    }
  } else {
    const upcomingSessions = await prisma.booking.findMany({
      where: {
        studentId: userId,
        status: { in: ["PENDING", "CONFIRMED"] },
        scheduledAt: { gte: /* @__PURE__ */ new Date() }
      },
      take: 5,
      orderBy: { scheduledAt: "asc" },
      include: {
        tutorProfile: {
          include: {
            user: {
              select: { name: true, email: true, image: true }
            }
          }
        }
      }
    });
    const stats = await prisma.booking.groupBy({
      by: ["status"],
      where: { studentId: userId },
      _count: true
    });
    dashboardData = {
      ...dashboardData,
      upcomingSessions,
      bookingStats: stats
    };
  }
  return dashboardData;
};
var UserService = {
  getMyProfile: getMyProfile3,
  getDashboard,
  updateProfile
};

// src/modules/user/user.controller.ts
var getMyProfile4 = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const user = await UserService.getMyProfile(userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Profile retrieved successfully",
    data: user
  });
});
var updateProfile2 = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const user = await UserService.updateProfile(userId, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Profile updated successfully",
    data: user
  });
});
var getDashboard2 = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  const dashboard = await UserService.getDashboard(userId, userRole);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Dashboard data retrieved successfully",
    data: dashboard
  });
});
var UserController = {
  getMyProfile: getMyProfile4,
  updateProfile: updateProfile2,
  getDashboard: getDashboard2
};

// src/modules/user/user.routes.ts
var router6 = Router6();
router6.use(auth_default("STUDENT" /* STUDENT */, "TUTOR" /* TUTOR */, "ADMIN" /* ADMIN */));
router6.get("/me", UserController.getMyProfile);
router6.get("/dashboard", UserController.getDashboard);
router6.put("/me", UserController.updateProfile);
var userRoutes = router6;

// src/modules/payment/payment.routes.ts
import { Router as Router7 } from "express";

// src/lib/stripe.ts
import Stripe from "stripe";
var stripeClient = null;
var getStripeClient = () => {
  if (!config2.stripe.secret_key) {
    throw new ApiError(500, "Stripe secret key is not configured");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(config2.stripe.secret_key);
  }
  return stripeClient;
};

// src/modules/payment/payment.service.ts
var getOrCreateStripeCustomerId = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, stripeCustomerId: true }
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }
  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: {
      userId: user.id
    }
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id }
  });
  return customer.id;
};
var createCheckoutSession = async (studentId, bookingId) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      tutorProfile: {
        include: {
          user: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }
  if (booking.studentId !== studentId) {
    throw new ApiError(403, "You are not allowed to pay for this booking");
  }
  if (booking.paymentStatus === PaymentStatus.PAID) {
    throw new ApiError(400, "Booking is already paid");
  }
  if (booking.status === "CANCELLED" || booking.status === "COMPLETED") {
    throw new ApiError(400, "You cannot pay for this booking anymore");
  }
  const stripe = getStripeClient();
  const customerId = await getOrCreateStripeCustomerId(studentId);
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: booking.currency,
          unit_amount: booking.amount,
          product_data: {
            name: `Tutoring session with ${booking.tutorProfile.user.name}`,
            description: `${booking.duration} minutes`
          }
        }
      }
    ],
    metadata: {
      bookingId: booking.id,
      studentId
    },
    success_url: `${config2.frontend_url}/dashboard/bookings?payment=success&bookingId=${booking.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config2.frontend_url}/dashboard/bookings?payment=cancel&bookingId=${booking.id}`
  });
  await prisma.$transaction([
    prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentStatus: PaymentStatus.PENDING,
        stripeCheckoutSessionId: checkoutSession.id
      }
    }),
    prisma.payment.upsert({
      where: { bookingId: booking.id },
      create: {
        bookingId: booking.id,
        studentId,
        amount: booking.amount,
        currency: booking.currency,
        status: PaymentStatus.PENDING,
        stripeCheckoutSessionId: checkoutSession.id
      },
      update: {
        status: PaymentStatus.PENDING,
        stripeCheckoutSessionId: checkoutSession.id
      }
    })
  ]);
  return {
    checkoutUrl: checkoutSession.url,
    sessionId: checkoutSession.id
  };
};
var confirmCheckoutSessionPayment = async (studentId, sessionId) => {
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"]
  });
  const bookingId = session.metadata?.bookingId;
  if (!bookingId) {
    throw new ApiError(400, "Checkout session is missing booking metadata");
  }
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      studentId: true,
      paymentStatus: true
    }
  });
  if (!booking) {
    throw new ApiError(404, "Booking not found for this checkout session");
  }
  if (booking.studentId !== studentId) {
    throw new ApiError(403, "You are not allowed to confirm this payment");
  }
  if (booking.paymentStatus === PaymentStatus.PAID) {
    return {
      paymentStatus: PaymentStatus.PAID,
      bookingStatus: BookingStatus.CONFIRMED,
      bookingId
    };
  }
  if (session.payment_status !== "paid") {
    throw new ApiError(
      400,
      "Payment is not completed yet. Please wait for confirmation."
    );
  }
  await markBookingAsPaid(session);
  return {
    paymentStatus: PaymentStatus.PAID,
    bookingStatus: BookingStatus.CONFIRMED,
    bookingId
  };
};
var constructWebhookEvent = (rawBody, signature) => {
  if (!config2.stripe.webhook_secret) {
    throw new ApiError(500, "Stripe webhook secret is not configured");
  }
  const stripe = getStripeClient();
  try {
    return stripe.webhooks.constructEvent(
      rawBody,
      signature,
      config2.stripe.webhook_secret
    );
  } catch (error) {
    console.error("[StripeWebhook] signature verification failed", error);
    throw new ApiError(400, "Invalid Stripe webhook signature");
  }
};
var markBookingAsPaid = async (session) => {
  const bookingId = session.metadata?.bookingId;
  if (!bookingId) {
    console.warn(
      "[StripeWebhook] checkout session missing bookingId metadata",
      {
        sessionId: session.id
      }
    );
    return { outcome: "no-op", reason: "missing-booking-id" };
  }
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      studentId: true,
      status: true,
      paymentStatus: true,
      amount: true,
      currency: true
    }
  });
  if (!booking) {
    console.warn("[StripeWebhook] booking not found", {
      bookingId,
      sessionId: session.id
    });
    return { outcome: "no-op", reason: "booking-not-found", bookingId };
  }
  if (booking.paymentStatus === PaymentStatus.PAID && booking.status === BookingStatus.CONFIRMED) {
    return { outcome: "no-op", reason: "already-paid", bookingId };
  }
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  const normalizedPaymentIntentId = paymentIntentId ?? null;
  await prisma.$transaction([
    prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: PaymentStatus.PAID,
        status: BookingStatus.CONFIRMED,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: normalizedPaymentIntentId,
        paidAt: /* @__PURE__ */ new Date()
      }
    }),
    prisma.payment.upsert({
      where: { bookingId },
      create: {
        bookingId,
        studentId: booking.studentId,
        amount: session.amount_total || booking.amount,
        currency: session.currency || booking.currency || config2.stripe.currency,
        status: PaymentStatus.PAID,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: normalizedPaymentIntentId,
        paidAt: /* @__PURE__ */ new Date()
      },
      update: {
        status: PaymentStatus.PAID,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: normalizedPaymentIntentId,
        paidAt: /* @__PURE__ */ new Date()
      }
    })
  ]);
  console.info("[StripeWebhook] payment marked paid", {
    bookingId,
    sessionId: session.id
  });
  return { outcome: "updated", bookingId };
};
var markBookingPaymentFailed = async (session) => {
  const bookingId = session.metadata?.bookingId;
  if (!bookingId) {
    console.warn("[StripeWebhook] failed session missing bookingId metadata", {
      sessionId: session.id
    });
    return { outcome: "no-op", reason: "missing-booking-id" };
  }
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      studentId: true,
      paymentStatus: true,
      amount: true,
      currency: true
    }
  });
  if (!booking) {
    console.warn("[StripeWebhook] booking not found for failed payment", {
      bookingId,
      sessionId: session.id
    });
    return { outcome: "no-op", reason: "booking-not-found", bookingId };
  }
  if (booking.paymentStatus === PaymentStatus.PAID) {
    return { outcome: "no-op", reason: "already-paid", bookingId };
  }
  await prisma.$transaction([
    prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: PaymentStatus.FAILED
      }
    }),
    prisma.payment.upsert({
      where: { bookingId },
      create: {
        bookingId,
        studentId: booking.studentId,
        amount: session.amount_total || booking.amount,
        currency: session.currency || booking.currency || config2.stripe.currency,
        status: PaymentStatus.FAILED,
        stripeCheckoutSessionId: session.id
      },
      update: {
        status: PaymentStatus.FAILED,
        stripeCheckoutSessionId: session.id
      }
    })
  ]);
  console.info("[StripeWebhook] payment marked failed", {
    bookingId,
    sessionId: session.id
  });
  return { outcome: "updated", bookingId };
};
var handleWebhook = async (event) => {
  console.info("[StripeWebhook] received event", {
    id: event.id,
    type: event.type
  });
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      return markBookingAsPaid(session);
    }
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      return markBookingAsPaid(session);
    }
    case "checkout.session.expired": {
      const session = event.data.object;
      return markBookingPaymentFailed(session);
    }
    case "checkout.session.async_payment_failed": {
      const session = event.data.object;
      return markBookingPaymentFailed(session);
    }
    default:
      console.info("[StripeWebhook] event ignored", {
        id: event.id,
        type: event.type
      });
      return { outcome: "ignored", reason: "unhandled-event" };
  }
};
var PaymentService = {
  createCheckoutSession,
  confirmCheckoutSessionPayment,
  constructWebhookEvent,
  handleWebhook
};

// src/modules/payment/payment.controller.ts
var createCheckoutSession2 = catchAsync(
  async (req, res) => {
    const studentId = req.user.id;
    const { bookingId } = req.body;
    if (!bookingId) {
      throw new ApiError(400, "bookingId is required");
    }
    const data = await PaymentService.createCheckoutSession(
      studentId,
      bookingId
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Checkout session created successfully",
      data
    });
  }
);
var confirmCheckoutSession = catchAsync(
  async (req, res) => {
    const studentId = req.user.id;
    const { sessionId } = req.body;
    if (!sessionId) {
      throw new ApiError(400, "sessionId is required");
    }
    const data = await PaymentService.confirmCheckoutSessionPayment(
      studentId,
      sessionId
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Checkout session confirmed successfully",
      data
    });
  }
);
var webhook = catchAsync(async (req, res) => {
  const signature = req.headers["stripe-signature"];
  if (!signature || Array.isArray(signature)) {
    throw new ApiError(400, "Missing Stripe signature header");
  }
  const rawBody = req.body;
  const event = PaymentService.constructWebhookEvent(rawBody, signature);
  const result = await PaymentService.handleWebhook(event);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Webhook processed",
    data: {
      received: true,
      eventId: event.id,
      eventType: event.type,
      result
    }
  });
});
var PaymentController = {
  createCheckoutSession: createCheckoutSession2,
  confirmCheckoutSession,
  webhook
};

// src/modules/payment/payment.routes.ts
var router7 = Router7();
router7.post("/webhook", PaymentController.webhook);
router7.post(
  "/checkout-session",
  auth_default("STUDENT" /* STUDENT */, "ADMIN" /* ADMIN */),
  PaymentController.createCheckoutSession
);
router7.post(
  "/confirm-session",
  auth_default("STUDENT" /* STUDENT */, "ADMIN" /* ADMIN */),
  PaymentController.confirmCheckoutSession
);
var paymentRoutes = router7;

// src/routes/index.ts
var router8 = Router8();
router8.use("/categories", categoryRoutes);
router8.use("/tutors", tutorRoutes);
router8.use("/bookings", bookingRoutes);
router8.use("/reviews", reviewRoutes);
router8.use("/users", userRoutes);
router8.use("/payments", paymentRoutes);
router8.use("/admin", adminRoutes);
var routes_default = router8;

// src/app.ts
var app = express();
app.use(
  cors({
    origin: config2.app_url,
    credentials: true
  })
);
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use("/api", routes_default);
app.get("/", (req, res) => {
  res.send("Learnzy API is running!");
});
app.use(notFound);
app.use(globalErrorHandler_default);
var app_default = app;

// src/index.ts
var PORT = process.env.PORT || 5e3;
async function main() {
  try {
    await prisma.$connect();
    console.log("Connected to the database successfully.");
    app_default.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("An error occurred:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}
main();
