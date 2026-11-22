# 1. Rebuild as a Next.js + Supabase web app

Date: 2026-11-22. Status: accepted.

The hackathon site was static HTML with no backend. As a startup selling feasibility studies, we need accounts, saved hotel projects, a lead pipeline and an admin view, so we rebuild from zero in a new repo on Next.js (TypeScript, App Router) with Supabase for Postgres, auth and row-level security, hosted on Vercel. The sizing tool stays usable without signing in.
