# יומן שינויים / Changelog

מסמך זה מתעד תיקונים שבוצעו מקומית (למשל ב-Cursor) כדי שיופיעו גם ב-Git וגם ב-Lovable אחרי `git push` ל-repo המחובר.

## [Unreleased]

### איכות קוד ו-CI

- **ESLint** — תיקון כללי `no-explicit-any` (החלפה בטיפוסי `Tables` / `Json` מ-Supabase, טיפוסי טפסים מיוצאים, וכו').
- **קונפיגורציה** — `tailwind.config.ts`: מעבר מ-`require` ל-`import` של `tailwindcss-animate`.
- **UI (shadcn)** — ב-`command.tsx` / `textarea.tsx`: תיקון כללי ממשקים ריקים (`no-empty-object-type`).
- **ESLint** — ביטול אזהרת `react-refresh/only-export-components` רק תחת `src/components/ui/**` (דפוס shadcn).
- **גיט** — `.gitignore`: הוספת `.cursor/debug*.log` (לוגי דיבאג מקומיים של Cursor לא נכנסים ל-repo).

### Edge Functions (Supabase)

- טיפוסים מפורשים במקום `any` ב־`ea-generate-campaign`, `ea-scrape-events`, `webhook-elementor`, `webhook-facebook`.
- בדיקת `ea_events` חסר בקמפיין בודד ב-`ea-generate-campaign` (תשובת 400 במקום כשל שקט).

---

**איך לראות את זה ב-Lovable:** חבר את אותו repo ל-GitHub/GitLab, ודאג ש-Lovable מצביע על אותו repo. אחרי `git push` מהמקומי, הפרויקט ב-Lovable ישקף את הקומיטים והקבצים (כולל קובץ זה).
