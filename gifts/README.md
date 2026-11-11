# Gifts · gifts.mcwhorezone.com

Family gift wishlists with approve-to-join accounts. Separate from the main mcwhorezone.com site.

## Local

```bash
cd gifts
npm install
npm run dev
```

- Web: http://127.0.0.1:5174
- API: http://127.0.0.1:4001

Default admin (override with env):

- Email: `colinmccu@outlook.com`
- Password: `change-me-admin`

## Vercel

1. Create a **new** Vercel project with Root Directory `gifts`.
2. Set `JWT_SECRET`, optional `GIFTS_ADMIN_EMAIL` / `GIFTS_ADMIN_PASSWORD` / `GIFTS_ADMIN_NAME`.
3. Attach a Blob store (`BLOB_READ_WRITE_TOKEN`).
4. Add domain `gifts.mcwhorezone.com`.

Do not point the main-site Vercel project at this folder.
