#!/usr/bin/env node
// scripts/check-migrations.js
// Simple check to list migration files and assert they contain SQL statements (CREATE/ALTER)
import fs from 'fs';
import path from 'path';

const migrationsDir = path.resolve('./database/migrations');

try {
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
  if (!files.length) {
    console.error('No migration files found in', migrationsDir);
    process.exit(2);
  }
  let ok = true;
  for (const f of files) {
    const full = path.join(migrationsDir, f);
    const content = fs.readFileSync(full, 'utf8');
    if (!/CREATE|ALTER|INSERT|UPDATE|DROP/i.test(content)) {
      console.error('Migration appears empty or invalid SQL (no CREATE/ALTER/INSERT/UPDATE/DROP):', f);
      ok = false;
    } else {
      console.log('Checked migration:', f);
    }
  }
  if (!ok) process.exit(2);
  console.log('Migration check: OK');
  process.exit(0);
} catch (err) {
  console.error('Migration check failed:', err.message);
  process.exit(2);
}
