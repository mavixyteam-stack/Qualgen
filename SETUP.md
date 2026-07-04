# Putting Mavixy live — step by step (no coding needed)

Total time: ~15 minutes. Total cost: **₹0**.

You'll create two free accounts (Supabase = database, Vercel = hosting), copy two values,
and click Deploy.

---

## Step 1 — Create your free database (Supabase)

1. Go to **[supabase.com](https://supabase.com)** → **Start your project** → sign in with GitHub.
2. Click **New project**.
   - Name: `mavixy`
   - Database password: click **Generate a password** and **copy it somewhere safe** — you'll need it in a moment.
   - Region: **Mumbai (ap-south-1)** (closest to you)
3. Wait ~2 minutes while the project is created.
4. At the top of the project page, click the **Connect** button.
5. In the window that opens, find **Transaction pooler** and copy that URI. It looks like:
   ```
   postgresql://postgres.abcdefgh:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
   ```
6. Replace `[YOUR-PASSWORD]` in that text with the database password from step 2.
   Keep the final result handy — this is your **DATABASE_URL**.

> ⚠️ Use the **Transaction pooler** one (port **6543**), not "Direct connection".
> The direct one doesn't work from Vercel's free servers.

That's the whole database setup. **You don't need to create any tables** — the app creates
them automatically the first time it runs.

## Step 2 — Deploy the app (Vercel)

1. Go to **[vercel.com](https://vercel.com)** → **Sign up** → **Continue with GitHub**.
2. Click **Add New… → Project**.
3. Find the **Qualgen** repository in the list and click **Import**.
   - If asked which branch: pick the branch this code is on.
4. Before clicking Deploy, open **Environment Variables** and add these two:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the connection string from Step 1 |
   | `SESSION_SECRET` | any long random sentence, e.g. `mavixy-rocket-mango-73-sunset-tiger` |

5. Click **Deploy**. Wait ~2 minutes.
6. Vercel gives you a link like `https://qualgen-xxxx.vercel.app` — **that's your live product.**

## Step 3 — Your first demo (60 seconds)

1. Open your link → **Get started free** → create your account.
2. On the empty dashboard click **⚡ Load sample workspace**.
3. You now have 14 enriched leads and a completed campaign with sends, opens, replies and
   intent scores — a full story to walk a client through.
4. For the live "wow" moment: go to **Campaigns → New campaign**, pick a few leads, watch
   the AI write personalized sequences, hit **Launch**, then open the Dashboard — sends,
   opens and scored replies stream in over the next few minutes while you talk.

You can also demo the CSV import with the file `sample-data/sample-leads.csv` from this repo.

---

## Optional — flip the engines from Demo to LIVE (still free)

The POC works fully without these. Add them whenever you're ready; each one is just an
extra Environment Variable in Vercel (**Project → Settings → Environment Variables**,
then **Redeploy**).

### Real emails (Resend — free tier, 3,000 emails/month)

1. Create an account at **[resend.com](https://resend.com)** → **API Keys** → **Create API key**.
2. In Vercel add: `RESEND_API_KEY` = the key.

> Without your own domain, Resend only delivers to **the email address you signed up with**
> — perfect for demos: put your own email on a lead and watch a real personalized email land
> in your inbox, and the open pixel light up the dashboard when you read it.
> To email anyone (real campaigns), verify a domain in Resend (needs a ~₹1,300/yr domain)
> and add `EMAIL_FROM` = `Your Name <you@yourdomain.com>`.

### Real AI (Anthropic Claude — pay per use, a few ₹ per campaign)

1. Create a key at **[console.anthropic.com](https://console.anthropic.com)** (needs a small
   prepaid balance, ~$5).
2. In Vercel add: `ANTHROPIC_API_KEY` = the key.

Now enrichment, sequences and intent scoring are written by Claude for every real lead.

### Real lead database (Apollo.io — free trial)

1. Get an API key from **[apollo.io](https://apollo.io)** (Settings → Integrations → API).
2. In Vercel add: `APOLLO_API_KEY` = the key.

"Find leads with AI" now searches Apollo's real prospect database.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Deploy fails on Vercel | Check both env vars exist, then **Deployments → Redeploy** |
| "Could not reach the server" on signup | `DATABASE_URL` is wrong — re-copy the **Transaction pooler** URI and make sure the password has no `[ ]` brackets left in it |
| Emails don't arrive (live mode) | Free Resend only delivers to your own signup email until you verify a domain |
| Demo campaign feels stuck | Keep the app tab open — the engine ticks every 15 seconds while the dashboard is open |
| Ran out of credits mid-demo | Credits page → **⚡ Add 500 demo credits** (POC-only button) |
