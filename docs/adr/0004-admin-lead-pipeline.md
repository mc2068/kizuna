# 4. Admin is a lead pipeline with owned leads and private files

Date: 2026-11-22. Status: accepted.

The Admin area is a small CRM for feasibility-study requests, not an analytics dashboard. Its home is the pipeline (status tiles plus filterable lead cards, after Integrate by Phenomenon); each lead has a detail page (after Ramotion's Carbon Solutions dashboard) with Overview, Notes, History and Files tabs. Each lead has one team owner. Quote files live in a private Supabase Storage bucket readable only by admins via storage RLS policies.
