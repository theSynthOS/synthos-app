import { inAppWallet } from "thirdweb/wallets";
import { scrollSepolia } from "../client";

export const wallets = [
  inAppWallet(
    // built-in auth methods
    {
      auth: {
        options: [
          "google",
          "x",
          "apple",
          "discord",
          "email",
          "passkey",
        ],
      },
      smartAccount: {
        chain: scrollSepolia,
        sponsorGas: false,
      },
    },
  ),
];