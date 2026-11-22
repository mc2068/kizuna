# 2. The sizing engine is a pure TypeScript module; assumptions live in code

Date: 2026-11-22. Status: accepted.

We port the old `engine.js` to a pure TypeScript module with no I/O. The browser runs it for instant results, and the server runs the same module for saved projects and PDF reports. Constants and assumptions (gas price, CO2 factors, efficiencies, city climate) stay in versioned, tested code rather than an admin-editable table, so the published numbers cannot drift without a reviewed change.
