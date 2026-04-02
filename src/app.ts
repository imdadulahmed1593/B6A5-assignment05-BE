import express, { Application } from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import cors from "cors";
import errorHandler from "./middlewares/globalErrorHandler";
import { notFound } from "./middlewares/notFound";
import routes from "./routes";
import { config } from "./config";

const app: Application = express();

app.use(
  cors({
    origin: config.app_url,
    credentials: true,
  }),
);

// Stripe webhook requires raw body for signature verification.
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json());

// Better Auth routes
app.all("/api/auth/*splat", toNodeHandler(auth));

// API routes
app.use("/api", routes);

app.get("/", (req, res) => {
  res.send("Learnzy API is running!");
});

app.use(notFound);
app.use(errorHandler);

export default app;
