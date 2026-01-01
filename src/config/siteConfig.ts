/*
  Centralised configuration for site‑specific details. By keeping server
  addresses and social links in a single place you can easily update them
  without searching through multiple files.
*/

export const siteConfig = {
  javaServer: {
    address: 'play.mcwhorezone.com',
    version: '1.21.11',
  },
  bedrockServer: {
    address: 'br.mcwhorezone.com',
    port: '19132',
    version: '1.21.11',
  },
  discordInvite: 'https://discord.gg/aw6MYg3sEc',
  instagramHandle: 'mcwhorezone',
  email: 'support@mcwhorezone.com',
};

export type SiteConfig = typeof siteConfig;