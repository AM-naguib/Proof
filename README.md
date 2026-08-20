# WhatsApp Message Renderer

أداة صغيرة لتحويل النص إلى صورة تشبه رسالة WhatsApp، مع تكيف تلقائي لحجم الـ bubble والصورة مع طول الرسالة.

## المميزات

- دعم العربي والإنجليزي والـ Emoji والـ line breaks.
- Incoming / Outgoing.
- Dark / Light mode.
- اتجاه تلقائي للنص RTL/LTR.
- تحكم في أقصى عرض للرسالة.
- تنزيل PNG ونسخ الصورة للحافظة.
- حفظ آخر الإعدادات في Local Storage.
- بدون Backend أو Database.
- بدون أي مكتبات JavaScript خارجية؛ التصدير يتم محليًا داخل المتصفح.

## Live Demo

https://am-naguib.github.io/Proof/

## التشغيل محليًا

افتح `index.html` مباشرة أو شغّل أي static server، مثل:

```bash
python -m http.server 8080
```

ثم افتح `http://localhost:8080`.

## GitHub Pages

المشروع Static ومجهز للنشر تلقائيًا عبر GitHub Actions من الفرع `main`.

كل Push جديد على `main` يشغّل Workflow النشر الموجود في `.github/workflows/pages.yml`.
