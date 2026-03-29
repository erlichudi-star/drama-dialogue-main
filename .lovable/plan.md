
# גילוי Voxel CPTs דרך סריקת WP Admin

## הבעיה
ה-CPTs של Voxel (כמו `study`) רשומים בוורדפרס עם `show_in_rest = false`. זה אומר:
- הם **לא** מופיעים ב-`/wp-json/wp/v2/types`
- הם **לא** רשומים כ-routes ב-`/wp-json/`
- ה-endpoint `/wp-json/voxel/v1/post-types` מחזיר 404
- קריאה ישירה ל-`/wp-json/wp/v2/study` מחזירה 404 (no route)

בקיצור: **הם בלתי נראים דרך REST API**.

## הפתרון
עם פרטי ההתחברות (שם משתמש + סיסמת אפליקציה), ניתן לגשת לעמוד הניהול של וורדפרס (`/wp-admin/`). בתפריט הצד של WP Admin, כל CPT רשום מופיע כקישור בפורמט:
```text
/wp-admin/edit.php?post_type=study
/wp-admin/edit.php?post_type=events
```

הפונקציה תסרוק את ה-HTML של WP Admin ותחלץ את כל ה-slugs מהתפריט.

## מה ישתנה

### `supabase/functions/ea-wp-connect/index.ts`
בתוך מצב `test`, נוסיף שלב 4 — **סריקת WP Admin**:

1. קריאה ל-`/wp-admin/` עם Basic Auth
2. חילוץ כל הקישורים בפורמט `edit.php?post_type=XXX` מה-HTML
3. סינון slugs מובנים (post, page, attachment וכו')
4. עבור כל slug חדש — ניסיון לספור פוסטים דרך WP Admin (fetch `edit.php?post_type=XXX`) ולחלץ את מספר הפוסטים מה-HTML
5. הוספתם לרשימת ה-CPTs עם `discovered_via: "admin"`

### `src/event-agent/pages/EASettings.tsx`
- הוספת badge "admin" ל-CPTs שנמצאו דרך סריקת Admin (בנוסף ל-"routes")
- הצגת הערה שלא ניתן לסנכרן CPTs שלא חשופים ב-REST API — עם אפשרות פרסום עתידית דרך scraping

### `src/event-agent/api.ts`
- ללא שינוי (אותו interface)

## פרטים טכניים

### לוגיקת סריקת Admin

```text
Step 4: Admin page scanning
─────────────────────────
GET /wp-admin/ (with Basic Auth cookie/header)
→ Parse HTML for: href="edit.php?post_type=([a-z0-9_-]+)"
→ Filter out known built-in slugs
→ For each new slug:
   - Try GET /wp-admin/edit.php?post_type={slug}
   - Extract post count from HTML (e.g. "X items" or "X פריטים")
   - Add to postTypes[] with discovered_via="admin"
```

### חשוב
CPTs שנמצאו דרך Admin אבל לא חשופים ב-REST API **לא יהיו ניתנים לסנכרון** דרך `/wp-json/wp/v2/{slug}`. לכן:
- אם CPT נמצא דרך Admin, ננסה גם לקרוא אליו דרך REST API
- אם REST API לא זמין, נסמן אותו כ-"needs REST API" ונציג למשתמש הנחייה ספציפית: "סוג תוכן `study` נמצא, אבל חייב להפעיל REST API עבורו כדי לסנכרן"
- חלופה: ניתן לסנכרן ישירות מה-HTML של WP Admin (scraping) — אבל זה פחות אמין

### קבצים לעדכון:
1. `supabase/functions/ea-wp-connect/index.ts` — הוספת שלב 4 (Admin scanning)
2. `src/event-agent/pages/EASettings.tsx` — הצגת CPTs שנמצאו ב-Admin עם סטטוס REST
