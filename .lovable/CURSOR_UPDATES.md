# עדכונים מ-Cursor / IDE (מקור שני לצ'אט)

**למה הקובץ הזה קיים:**  
Lovable **לא** רואה את השיחה ב-Cursor. כל מה שמופיע כאן נשמר ב-Git — אחרי `git push` הוא יופיע גם ב-Lovable (בתיקייה `.lovable/`, ליד `plan.md`) וגם ב-GitHub.

**איך להשתמש:**

1. אחרי עבודה משמעותית ב-Cursor — לעדכן כאן **שורה אחת** (תאריך + תקציר) או לבקש מהעוזר לעשות זאת.
2. לפרטים טכניים מלאים ראו גם [`CHANGELOG.md`](../CHANGELOG.md) בשורש הפרויקט.
3. תמיד: `git add` → `git commit` → `git push` כדי ש-Lovable יסתנכרן.

---

## יומן (החדש למעלה)

| תאריך | תקציר |
|--------|--------|
| 2026-03-29 | `supabaseUrl is required`: לוגיקת fallback הועברה ל־`resolve-env.ts` (לא נמחק עם regenerate של `client.ts`). נדרש `git pull` + רענון קשיח. |
| 2026-03-29 | **דף לבן:** בלי `.env`, `createClient(undefined)` זרק בייבוא — תוקן עם placeholder + `console.warn`; יש להעתיק `.env.example` → `.env` עם מפתחות Supabase אמיתיים. |
| 2026-03-29 | חיזוק RTL: עטיפת `App` ב-`dir="rtl"` + `lang="he"`, `dir="rtl"` ל-Sonner, טוסטים ב-`end-0`, `body` מפורש ל-RTL, אייקון ניווט פעיל ב-`ms-auto`. |
| 2026-03-29 | תיקוני ESLint בכל הפרויקט (טיפוסים, Tailwind import, shadcn), override ל-`react-refresh` ב-UI, תיקוני Edge Functions, `CHANGELOG.md`, עדכון `.gitignore` ללוגי Cursor. |

---

## תבנית לשורה חדשה (העתק/הדבק)

```text
| YYYY-MM-DD | משפט קצר: מה השתנה למשתמש או לקוד |
```
