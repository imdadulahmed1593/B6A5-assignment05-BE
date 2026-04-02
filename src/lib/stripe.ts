import Stripe from "stripe";
import { config } from "../config";
import { ApiError } from "../utils/ApiError";

let stripeClient: Stripe | null = null;

export const getStripeClient = () => {
  if (!config.stripe.secret_key) {
    throw new ApiError(500, "Stripe secret key is not configured");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(config.stripe.secret_key);
  }

  return stripeClient;
};
