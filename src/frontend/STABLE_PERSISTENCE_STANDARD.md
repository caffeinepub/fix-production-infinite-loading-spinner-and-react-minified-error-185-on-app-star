# Stable Persistence Standard (Mandatory)

This document defines **mandatory rules** for data persistence in this Internet Computer application. All business-critical and user-entered data **must survive canister upgrades**.

---

## 1. Core Principle

> **If a user enters data, it must be stored in stable memory.**

Any feature that violates this rule is **not production-ready** and must be refactored before deployment.

---

## 2. Data Classification

### 2.1 MUST Be Stable (Business-Critical)

The following categories of data **must always** be stored in stable memory:

- ✅ **User profiles** (name, restaurant name, settings)
- ✅ **All financial transactions** (amount, category, date, description, owner)
- ✅ **ID counters** (e.g., `nextTransactionId`) to prevent ID reuse
- ✅ **Authorization state** (admin/user roles, permissions)
- ✅ **Any user-generated content** (notes, configurations, preferences)

**Technical requirement:** These must be stored using one of:
- `stable var` declarations in Motoko
- `preupgrade` / `postupgrade` migration hooks that serialize/deserialize runtime structures

### 2.2 MAY Be Volatile (Derived/Computed)

The following categories **do not need** stable storage:

- ❌ **Analytics aggregates** (monthly stats, totals) — can be recomputed from transactions
- ❌ **UI cache** (temporary display state)
- ❌ **Derived reports** (expense breakdowns) — can be regenerated from source data

**Rule:** If data can be **fully reconstructed** from stable sources, it does not need its own stable storage.

---

## 3. Mandatory Steps When Adding/Changing State

When introducing **any new user-facing state** (e.g., a new entity type, field, or collection), you **must** complete all of the following:

### Step 1: Define Stable Schema
- Add the data structure to the stable storage section of `backend/main.mo`
- Document the schema with inline comments
- Use upgrade-safe types (no closures, no runtime-only references)

### Step 2: Implement Migration Hooks
- If using runtime structures (e.g., `Map`, `HashMap`), implement:
  - `system func preupgrade()` — serialize runtime state to stable variables
  - `system func postupgrade()` — restore runtime state from stable variables
- Ensure ID counters and indices are preserved

### Step 3: Verify Upgrade Safety
- Test that data survives a canister upgrade:
  1. Add sample data
  2. Perform `dfx canister install --mode upgrade`
  3. Verify all data is still present and correct
- Confirm no ID reuse occurs after upgrade

### Step 4: Update This Checklist
- If a new category of business-critical data is introduced, add it to section 2.1
- Document any new migration patterns or edge cases

---

## 4. Current Stable Schema (Reference)

As of the latest version, the following data is stored in stable memory:

| Data Type | Storage Method | Migration |
|-----------|----------------|-----------|
| User profiles | `stable var userProfiles` | preupgrade/postupgrade |
| Transactions | `stable var transactions` | preupgrade/postupgrade |
| Transaction ID counter | `stable var nextTransactionId` | Direct stable var |
| Access control state | `stable var accessControlState` | preupgrade/postupgrade |

**Note:** This table must be updated whenever the stable schema changes.

---

## 5. Enforcement

### 5.1 Code Review Checklist

Before merging any feature that introduces new state, reviewers must verify:

- [ ] All user-entered data is stored in stable memory
- [ ] Migration hooks are implemented (if using runtime structures)
- [ ] Upgrade safety has been tested
- [ ] This document has been updated if needed

### 5.2 Deployment Policy

**No feature may be deployed to production** if it stores business-critical data in non-stable memory without a migration path.

---

## 6. Migration Pattern (Standard Template)

Use this pattern for all new stable state:

