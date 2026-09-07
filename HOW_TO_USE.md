# How to use Estimate Import

This walks through creating your first Estimate Import row, what happens after you save it, and how to read the result. Assumes the solution is already imported and the flow is turned on — see [README.md](README.md#installation) if not.

## 1. Create a row

Open the **Estimate Import** table (via your app's navigation if you added it, or the direct URL from the README) and use **+ New** (Quick Create or the Main form both work).

Only **Project** is required. Everything else is optional, though a few fields are *recommended* depending on what you're recording:

| You're recording... | Fill in |
|---|---|
| Time/labor | Project Task, Resource Category (recommended, not required) |
| An expense | Transaction Category (recommended, not required) |
| A catalog product | Product |
| Something not in the catalog | Write-in Product Name instead of Product |
| A unit-based line (hours, days, etc.) | Unit |

Set **Quantity**, **Cost Rate**, **Sale Rate**, and **Start/End Date** as needed, then save.

## 2. What happens next

Saving the row triggers the **Community - Process Estimate Import** flow within a few seconds:

1. It finds (or creates) the parent **Estimate** header for the Project.
2. It creates a **Cost Estimate Line** using your values.
3. Project Operations automatically generates the matching **Sales Estimate Line** for that Cost line (this is standard PO behavior — the solution can't create it directly, PO rejects that). The flow updates that auto-created Sales line with your Sale Rate and other details.
4. Both generated lines get linked back to your staging row (`Cost Estimate Line` / `Sale Estimate Line` fields).
5. **Processing Status** flips to **Processed**.

Refresh the record (or the view) after a few seconds and you should see:
- Processing Status = **Processed**
- Cost Estimate Line and Sale Estimate Line both populated with links to real records
- Processing Notes may contain soft recommendations, e.g. *"No Project Task supplied"* or *"Resource Category recommended when Transaction Classification = Time"* — these are informational, not errors, and never block processing.

## 3. If something goes wrong

**Processing Status = Error**: open the record and read **Processing Notes** — the flow writes a diagnostic message there describing what failed (e.g. a validation issue or a Dataverse error from the Create/Update call). This is always visible from Dataverse itself; you don't need to open Power Automate to see it.

**Nothing happened at all (status stuck on New)**: check that the flow is turned **On** and its Dataverse connection reference is connected (see [README installation step 2](README.md#installation)). Also check Power Automate's run history for the flow directly — a run that never started at all (rather than one that failed) usually means the trigger itself isn't active.

**Sale rate shows 0 on the generated Sales line**: this is expected if your project has no sales price list configured — see the [Known limitations](README.md#-known-limitations-read-before-you-rely-on-this) section in the README. `est_salerate` on your staging row is still there and correct; only Project Operations' own recalculated field resets.

## 4. Editing an already-processed row

Change quantity, rate, dates, description, product, or unit and save — the flow resyncs those changes onto the existing Cost/Sales lines in place (no duplicate lines get created). Note: if you change **only** a lookup field (e.g. swap the Product) without touching any other field, the flow won't re-trigger on its own — see the lookup-only-edit limitation in the README. Change any other field alongside it to force a resync.

## 5. Deleting a row

Deleting an Estimate Import row deletes its linked Cost and Sales Estimate Lines too. This keeps generated records from becoming orphaned, but it means deleting the staging row is a real, permanent deletion of the estimate data downstream — not just tidying up the staging table. Confirm you actually want the estimate lines gone before deleting.

This only works for rows processed after the Delete fix landed (the Cost line needs a stamped back-reference to be found once the staging row is gone). A row processed before that has no stamp — deleting it is a harmless no-op (nothing gets cleaned up, but nothing breaks either), and it self-heals the moment you next edit that row, since editing stamps the reference too.

## 6. Bulk import

There's no separate "bulk mode" — the flow reacts to each row the same way regardless of how it was created. To bulk-load, use any standard Dataverse bulk-create method (Excel add-in, `pac`/Web API scripting, Power Automate's own "Add a new row in a loop", Dataflows, etc.) to create many `est_estimateimport` rows, and the flow processes each one as it lands. Be mindful of API/throughput limits in your environment if importing a very large batch at once — consider batching in groups rather than firing thousands of creates in one burst.
