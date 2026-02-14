
# Database Comparison: Supabase vs Firebase

## Supabase (PostgreSQL)
- **Free Tier**: 500MB database, 2GB bandwidth.
- **Inactivity Pausing**: Yes, projects **pause after 7 days of inactivity**.
  - **Impact**: The database shuts down. When you visit the dashboard, you can "Restore" it with one click (takes ~2 minutes). It does **NOT** delete your data.
  - **Solution**: For a resume project, this is usually fine. If a recruiter visits and it fails, it might look bad, but you can set up a "Keep Alive" script (a simple GitHub Action that pings your DB once a week) to prevent pausing.
- **Resume Value**: **High**. SQL (Postgres) is a highly transferable skill asked in almost every backend interview.

## Firebase (NoSQL)
- **Free Tier (Spark Plan)**: Generous limits (1GB storage, 10GB transfer).
- **Inactivity Pausing**: **No**. It's "Serverless" in a way that it scales to zero but doesn't "pause" like a VM. It's always available.
- **Data Model**: NoSQL (JSON-like documents).
  - **Pros**: Very fast to start if you just want "JSON in the cloud".
  - **Cons**: Querying complex relationships (e.g., "Get all posts by users who follow me") is much harder than SQL.
- **Resume Value**: **Medium**. Good for rapid prototyping, but less "enterprise backend" than SQL.

## Recommendation for Resume
**Stick with Supabase (SQL).**
- **Reason**: Being able to say "I built a Next.js app with a PostgreSQL database" sounds much more professional than "I used Firebase".
- **The "Pause" Issue**: I can help you add a simple "Cron Job" (scheduled task) using GitHub Actions that pings your database every Sunday. This will keep it active **forever** for free.

## Alternative: Vercel Postgres
- Vercel also offers a managed Postgres database (built on Neon).
- **Free Tier**: 256MB storage.
- **Inactivity**: **Does not pause**.
- **Integration**: Extremely tight with Next.js (literally one click).
- **Cons**: Storage is smaller (256MB vs 500MB).
