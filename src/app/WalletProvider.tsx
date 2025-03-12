import { inAppWallet } from "thirdweb/wallets";

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

    },
    // or bring your own auth endpoint
  ),
];
