# Migration Guide: Managed Supabase to Self-Hosted on Easypanel

This guide outlines the steps to migrate your existing Supabase project to a self-hosted instance running on Easypanel.

## Prerequisites

*   **Easypanel Installed**: You should have a server with Easypanel installed and accessible.
*   **Database Tools**: `pg_dump` and `psql` (or Docker to run them) installed on your local machine.
*   **Supabase CLI**: Optional, but helpful for some operations.
*   **Access**:
    *   **Source**: Connection string for your managed Supabase project (Old).
    *   **Destination**: Access to your Easypanel dashboard.

---

## Step 1: Deploy Supabase on Easypanel

1.  Log in to your **Easypanel Dashboard**.
2.  Create a new **Project** (e.g., `supabase-prod`).
3.  Click **Templates** and search for **Supabase**.
4.  Select the Supabase template and click **Create**.
5.  **Configuration**:
    *   The template will generate default passwords and keys. **IMPORTANT:** You should ideally generate your own secure keys for `JWT_SECRET`, `ANON_KEY`, and `SERVICE_ROLE_KEY` to ensure security, or note down the generated ones.
    *   Set the `DASHBOARD_USERNAME` and `DASHBOARD_PASSWORD` for the Supabase Studio.
6.  **Deploy** the service.
7.  Wait for all services (Postgres, Kong, Auth, Rest, Realtime, Storage, etc.) to start.
8.  **Get Connection Details**:
    *   Go to the **Postgres** service in Easypanel.
    *   Find the **External Connection String**. It will look like: `postgresql://postgres:password@your-easypanel-ip:5432/postgres`.
    *   *Note: You may need to expose the Postgres port (typically 5432) in the Easypanel service settings if it's not exposed by default.*

---

## Step 2: Backup Data from Managed Supabase

You need to export your schema and data from the old project.

**Using `pg_dump` (Recommended):**

Run this command in your local terminal:

```bash
# Pattern: pg_dump "your-managed-connection-string" --clean --if-exists --quote-all-identifiers --exclude-table-data 'storage.objects' --no-owner --no-privileges > dump.sql

# Example
pg_dump "postgres://postgres:password@db.projectref.supabase.co:5432/postgres" \
  --clean \
  --if-exists \
  --quote-all-identifiers \
  --exclude-schema "auth" \
  --exclude-schema "storage" \
  --no-owner \
  --no-privileges \
  > full_backup.sql
```

> **Note on `auth` and `storage` schemas:**
> *   Migrating `auth` schema directly can be tricky because of specific triggers and user data structures.
> *   Migrating `storage` (files) requires moving the actual blobs, not just the database rows.
> *   If you want to move **everything** (including users), remove `--exclude-schema "auth"`. Be aware that you might need to manually handle some conflicts or extensions.

**Alternative: Export just the public schema (Your App Data)**

```bash
pg_dump "postgres://..." --schema public --no-owner --no-privileges > public_schema.sql
```

---

## Step 3: Restore Data to Easypanel Supabase

1.  **Verify Connection**: Ensure you can connect to your Easypanel Postgres instance.
    ```bash
    psql "postgres://postgres:newpassword@your-easypanel-ip:5432/postgres"
    ```
2.  **Restore the Dump**:

    ```bash
    psql "postgres://postgres:newpassword@your-easypanel-ip:5432/postgres" < full_backup.sql
    ```

    *If you encounter errors about extensions (like `uuid-ossp` or `pgcrypto`):*
    *   Log in to the destination DB via `psql`.
    *   Enable extensions manually if they fail: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`

---

## Step 4: Update Environment Variables

Update your local project's `.env` file to point to the new server.

1.  **Get the API URL**: This is the URL of your Kong service in Easypanel (the generic Supabase API URL). It usually looks like `https://supabase.your-domain.com`.
2.  **Get the Keys**:
    *   These are the `ANON_KEY` and `SERVICE_ROLE_KEY` you configured (or generated) in the Easypanel Supabase service environment variables.

**Modify `.env`:**

```properties
# Old
# VITE_SUPABASE_URL=https://wmpwqotfncymoswctrqo.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJhbGci...

# New (Self-Hosted)
VITE_SUPABASE_URL=https://supabase.your-domain.com
VITE_SUPABASE_ANON_KEY=your-new-anon-key
```

---

## Step 5: Migration Verification

1.  **Start your local app**: `npm run dev`
2.  **Test Authentication**: Try to sign up or log in.
    *   *Note: If you didn't migrate `auth` schema, you will have no users. You need to sign up again.*
3.  **Test Data Access**: Ensure your app can read/write to the tables.
4.  **Test Realtime**: Check if realtime subscriptions work (if used).

## Step 6: Migrating Storage (Optional)

Moving storage files is a separate process.
1.  **Scripted Transfer**: Write a script to download files from easier Supabase using the SDK and upload them to the new instance.
2.  **Rclone**: Use `rclone` to sync the S3-compatible storage backends if you have direct S3 access (Supabase Storage is S3 compatible).

## Step 7: Migrating Auth Users (Advanced)

If you must preserve user accounts (UUIDs and password hashes):
1.  Dump the `auth` schema from source:
    ```bash
    pg_dump "source_connection_url" --schema auth --data-only > auth_users.sql
    ```
2.  Restore to destination:
    ```bash
    psql "destination_connection_url" -f auth_users.sql
    ```
*Warning: This can conflict with existing default users or triggers in the new instance. Proceed with caution.*

---

## Step 8: Configure Auth Providers & SMTP

Your self-hosted instance won't automatically inherit your Auth configurations (Google, Facebook logins, etc.) or SMTP settings.

1.  **Auth Providers (Google, Facebook, etc.)**:
    *   In Managed Supabase, you configured these in the Dashboard -> Auth -> Providers.
    *   In Self-Hosted (Easypanel), you often need to set these via **Environment Variables** in the `auth` (GoTrue) service, or via the Supabase Studio if exposed.
    *   *Example Env Vars for Easypanel:*
        *   `GOTRUE_EXTERNAL_GOOGLE_ENABLED`: `true`
        *   `GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID`: `...`
        *   `GOTRUE_EXTERNAL_GOOGLE_SECRET`: `...`
        *   `GOTRUE_EXTERNAL_FACEBOOK_ENABLED`: `true`
    *   Check the [Supabase Self-Hosting Auth Docs](https://supabase.com/docs/reference/self-hosting-auth/auth-config) for the exact variable names.

2.  **SMTP (Email)**:
    *   You need to configure your own SMTP server (Managed Supabase provides a default one with limits).
    *   Set these Environment Variables in your Easypanel `auth` service:
        *   `GOTRUE_SMTP_HOST`
        *   `GOTRUE_SMTP_PORT`
        *   `GOTRUE_SMTP_USER`
        *   `GOTRUE_SMTP_PASS`
        *   `GOTRUE_SMTP_ADMIN_EMAIL`
        *   `GOTRUE_SMTP_SENDER_NAME`

3.  **Storage Buckets**:
    *   If you had public buckets, you might need to re-make them "Public" in the new Studio or via SQL:
        ```sql
        UPDATE storage.buckets SET public = true WHERE id = 'avatars';
        ```

---

## Step 9: Deploying Edge Functions (Self-Hosted)

The `supabase functions deploy` command is designed for the Supabase Cloud. For self-hosted instances on Easypanel, deployment usually works by **syncing your function files** to the server, where the Edge Runtime service is running.

### Option A: Sync via SCP/Rsync (Recommended)

1.  **Locate the Volume**: Find where Easypanel mounts the `functions` volume. In the standard template, this might be a persistent volume path like `/etc/supabase/functions` or `./volumes/functions`.
2.  **Transfer Files**: Use `rsync` or `scp` to copy your local `supabase/functions` directory to the server.

    ```bash
    # Example: Syncing local functions to remote server
    rsync -avz --delete ./supabase/functions/ root@your-easypanel-ip:/path/to/supabase/volumes/functions/
    ```

3.  **Restart Service**: You may need to restart the "Functions" or "Edge Runtime" service in Easypanel for changes to take effect (though the runtime often supports hot-reloading).

### Option B: Secrets Management

*   **Cloud**: You used `supabase secrets set` (CLI).
*   **Self-Hosted**: You must set these as **Environment Variables** in the Easypanel service settings for the **Functions** (or Edge Runtime) service.
    *   Example: Add `FACEBOOK_APP_ID=...` in the "Environment" tab of the Functions service.

### Option C: Custom Deployment Script

You can create a script `deploy-functions.sh` to mimic the CLI experience:

```bash
#!/bin/bash
# deploy-functions.sh
echo "Deploying functions to Self-Hosted..."
rsync -avz ./supabase/functions/ root@your-server-ip:/path/to/volumes/functions/
echo "Done!"
```

