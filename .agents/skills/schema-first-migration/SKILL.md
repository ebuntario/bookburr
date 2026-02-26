---
name: Schema-First Database Migration
description: >
  Enforces a schema-first workflow for all database changes. The canonical
  schema file (db/schema.sql) is edited first, then the diff is used to
  construct the migration file. This prevents drift between schema and
  migrations. Use when making any database change — adding tables, columns,
  functions, triggers, indexes, RLS policies, or types.
---

# Schema-First Database Migration

## Why

Migration files accumulate over time and become unreliable as a reference for
the current database state. `db/schema.sql` is the **single source of truth**
for what the database should look like right now.

## Workflow

### Step 1: Read the Canonical Schema

Before making ANY database change, read `db/schema.sql` to understand the
current state of the relevant tables, functions, triggers, policies, and types.

The file is organized into `§` sections by domain. To see all sections:

```
grep "^-- §" db/schema.sql
```

To find specific objects:

```
grep "CREATE TABLE.*table_name" db/schema.sql
grep "CREATE.*FUNCTION.*function_name" db/schema.sql
```

### Step 2: Edit `db/schema.sql`

Make your changes directly in `db/schema.sql`. This includes:

- **New tables**: Add the full `CREATE TABLE` statement in the appropriate
  section
- **New columns**: Add the column to the existing `CREATE TABLE` block
- **New functions**: Add the full `CREATE OR REPLACE FUNCTION` block
- **New triggers**: Add the trigger definition
- **New RLS policies**: Add the policy definition
- **New indexes**: Add the `CREATE INDEX` statement
- **Modified functions**: Update the function body in-place
- **Dropped objects**: Remove the definition entirely from the file

> [!IMPORTANT]
> The schema file should always represent the **desired end state**, not the
> migration steps to get there.

### Step 3: Construct the Migration from the Diff

After editing `db/schema.sql`, construct the migration SQL by translating the
diff into executable migration statements:

| Schema Change                  | Migration Statement                                 |
| ------------------------------ | --------------------------------------------------- |
| New `CREATE TABLE` block added | `CREATE TABLE ...`                                  |
| New column in existing table   | `ALTER TABLE ... ADD COLUMN ...`                    |
| Column removed from table      | `ALTER TABLE ... DROP COLUMN ...`                   |
| Column type changed            | `ALTER TABLE ... ALTER COLUMN ... TYPE ...`          |
| New function added             | `CREATE OR REPLACE FUNCTION ...` (copy from schema) |
| Function body changed          | `CREATE OR REPLACE FUNCTION ...` (copy from schema) |
| Function removed               | `DROP FUNCTION IF EXISTS ...`                       |
| New trigger added              | `CREATE TRIGGER ...`                                |
| Trigger removed                | `DROP TRIGGER IF EXISTS ...`                        |
| New index added                | `CREATE INDEX ...`                                  |
| Index removed                  | `DROP INDEX IF EXISTS ...`                          |
| New RLS policy added           | `CREATE POLICY ...`                                 |
| RLS policy removed             | `DROP POLICY IF EXISTS ...`                         |
| New type/enum added            | `CREATE TYPE ...`                                   |
| Enum value added               | `ALTER TYPE ... ADD VALUE ...`                      |

### Step 4: Create the Migration File

1. Generate timestamp: `date -u +"%Y%m%d%H%M%S"`
2. Check for conflicts with existing migrations for the same date
3. Create file in the migrations directory: `YYYYMMDDHHMMSS_descriptive_name.sql`
4. Write the migration SQL (from Step 3)
5. Apply the migration to the database
6. Regenerate types if the project uses TypeScript type generation from the schema

### Step 5: Verify Consistency

After applying, verify that `db/schema.sql` still matches the live database
state. There should be no pending schema drift.

### Step 6: Run Database Tests (if applicable)

If the migration touches critical business logic (accounting, permissions,
triggers, computed values), run the database test suite. All tests must pass
before committing.

If a test fails, it likely means the migration introduced a regression — fix the
migration, not the test (unless the test expectation is genuinely wrong).

## Rules

1. **NEVER** write a migration without first updating `db/schema.sql`
2. **NEVER** use migration files as reference for current schema — always read
   `db/schema.sql`
3. **NEVER** add objects to the migration that aren't reflected in
   `db/schema.sql`
4. **NEVER** overwrite `db/schema.sql` with `pg_dump` output — it will destroy
   the section organization
5. **Always** place new objects in the correct `§` section (not appended at end)
6. **Always** use `IF EXISTS` / `IF NOT EXISTS` guards in migrations for safety
7. **Always** keep `db/schema.sql` header comment block intact
8. **Always** keep blocks together: `CREATE` + `ALTER OWNER` + `COMMENT ON` as
   one unit
9. For **function changes**, copy the entire function body from `db/schema.sql`
   into the migration — don't try to write it separately
10. If a function spans domains, place it in the section of its **primary
    output/side-effect**

## Example

### User request: "Add a `notes` column to the `transactions` table"

**Step 1** — Read schema:

```sql
-- Find the CREATE TABLE block in db/schema.sql
CREATE TABLE public.transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    amount integer NOT NULL,
    ...
);
```

**Step 2** — Edit `db/schema.sql`:

```sql
CREATE TABLE public.transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    amount integer NOT NULL,
    notes text,              -- added
    ...
);
```

**Step 3** — Construct migration:

```sql
-- Add notes column to transactions
ALTER TABLE public.transactions
    ADD COLUMN IF NOT EXISTS notes text;
```

**Step 4** — Create migration file and apply.
