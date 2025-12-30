/*
  Centralised configuration for site‑specific details. By keeping server
  addresses and social links in a single place you can easily update them
  without searching through multiple files.
*/

export const siteConfig = {
  javaServer: {
    address: 'play.mcwhorezone.com',
    version: '1.20.x',
  },
  bedrockServer: {
    address: 'bedrock.mcwhorezone.com',
    port: '19132',
    version: '1.20.x',
  },
  discordInvite: 'https://discord.gg/your-invite',
  instagramHandle: 'mcwhorezone',
  email: 'support@mcwhorezone.com',
};

export type SiteConfig = typeof siteConfig;