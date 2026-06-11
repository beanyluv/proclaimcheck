
  # PROCLAIM CHECK

  This is a code bundle for PROCLAIM CHECK. 
  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Production Deployment

  ### Option 1: Quick Vercel Deploy (with persistent Supabase database)
  
  1. Read [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) to create and configure Supabase database
  2. Follow [DEPLOY_PRODUCTION.md](./DEPLOY_PRODUCTION.md) for terminal-based deployment via Vercel
  
  ### Option 2: Deploy dengan serverless API (no external database)
  
  Vercel config sudah ready. Setup:
  
  1. Pastikan `vercel.json` ada di root dan berisi rule rewrite untuk `/api/*`
  2. Commit semua perubahan termasuk folder `api/` dan `server/db.json`
  3. Run: `vercel --prod`

  **Note**: Tanpa Supabase, data hanya tersimpan selama deployment. Reboot/rebuild akan reset data.
  
