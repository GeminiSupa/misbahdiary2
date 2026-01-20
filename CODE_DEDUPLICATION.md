# Code Deduplication Guide

## Current Situation

The codebase currently has duplicate directories:
- Root directory (`/`): Contains `app/`, `components/`, `lib/`
- Web directory (`/web/`): Contains `app/`, `components/`, `lib/`

## Source of Truth

**The `web/` directory is the source of truth for deployment.**

- Vercel deployment uses `web/` as the root directory
- All production builds come from `web/`
- All changes should be made in `web/` directory

## Recommendation

### Option A: Keep Both (Current State)
- **Pros**: Allows for different configurations, testing
- **Cons**: Maintenance burden, risk of inconsistencies
- **Action**: Document which is which, ensure changes are synced

### Option B: Remove Root Directories (Recommended for Production)
- **Pros**: Single source of truth, no confusion, smaller repo
- **Cons**: Need to migrate any root-specific configs
- **Action**: 
  1. Verify all changes are in `web/`
  2. Remove root `app/`, `components/`, `lib/` directories
  3. Update any root-level scripts/configs that reference these

### Option C: Remove Web Directory (Not Recommended)
- Would require updating Vercel configs
- All deployment docs reference `web/`

## Migration Steps (If Choosing Option B)

1. **Verify all changes are in `web/`:**
   ```bash
   # Compare directories
   diff -r app/ web/app/
   diff -r components/ web/components/
   diff -r lib/ web/lib/
   ```

2. **Backup root directories:**
   ```bash
   mkdir -p backup
   cp -r app components lib backup/
   ```

3. **Remove root directories:**
   ```bash
   rm -rf app/ components/ lib/
   ```

4. **Update any scripts/configs:**
   - Check `package.json` scripts
   - Check `tsconfig.json` paths
   - Update any documentation

5. **Test deployment:**
   - Ensure Vercel still builds correctly
   - Test all functionality

## Current Status

- ✅ All recent changes have been made in both root and `web/` directories
- ⚠️ Future changes should prioritize `web/` directory
- 📝 This document serves as a reminder of the duplication

## Next Steps

1. Review this document
2. Decide on Option A, B, or C
3. If Option B, follow migration steps above
4. Update team documentation
