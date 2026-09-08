# Frame Studio

أداة احترافية مجانية لإنشاء صور شخصية جاهزة باستخدام فريمات مخصصة. تعمل بالكامل في المتصفح بدون خادم.

## Features

- رفع صور JPG, PNG, WEBP مع دعم السحب والإفلات
- اختيار فريمات من مكتبة قابلة للتوسيع
- تحريك وتكبير وتصغير الصورة داخل الفريم
- إضافة النصوص (الاسم، المسمى، التفاصيل) مع تحديث مباشر
- تخصيص حجم الخط واللون والمحاذاة
- معاينة مباشرة أثناء التعديل
- تصدير PNG أو JPG بجودة عالية
- مشاركة عبر Web Share API
- تصميم متجاوب يعمل على جميع الأجهزة
- دعم كامل للعربية (RTL)
- خصوصية تامة — لا صور تُرفع لأي خادم

## Installation

### التشغيل المحلي

1. حمّل أو استنسخ المستودع
2. افتح `index.html` في المتصفح مباشرة

```bash
git clone https://github.com/yourusername/frame-studio.git
cd frame-studio
# افتح index.html في المتصفح
```

### التشغيل عبر خادم محلي (اختياري)

```bash
# باستخدام Python
python -m http.server 8000

# أو باستخدام Node.js
npx serve .
```

## GitHub Pages

### رفع المشروع على GitHub

1. أنشئ مستودع جديد على GitHub
2. ارفع جميع ملفات المشروع
3. تأكد من بنية المجلدات الصحيحة

### تفعيل GitHub Pages

1. اذهب إلى **Settings** في المستودع
2. اختر **Pages** من القائمة الجانبية
3. في **Source** اختر **Deploy from a branch**
4. اختر الفرع `main`
5. اضغط **Save**
6. بعد دقائق سيكون الموقع متاحًا على:
   `https://yourusername.github.io/frame-studio/`

## Project Structure

```
frame-studio/
├── index.html              # الصفحة الرئيسية
├── editor.html             # محرر التصاميم
├── about.html              # حول الموقع
│
├── css/
│   ├── style.css           # التصميم الأساسي و Design System
│   ├── editor.css          # تصميم المحرر
│   └── responsive.css      # التصميم المتجاوب
│
├── js/
│   ├── app.js              # المنطق المشترك
│   ├── editor.js           # محرك المحرر الرئيسي
│   ├── frames.js           # نظام الفريمات
│   └── export.js           # وحدة التصدير والمشاركة
│
├── assets/
│   ├── frames/             # صور الفريمات (PNG شفاف)
│   ├── images/             # صور أخرى
│   └── fonts/              # خطوط مخصصة
│
├── config/
│   └── frames.json         # إعدادات الفريمات
│
├── README.md
└── .gitignore
```

## Adding a New Frame

### الخطوة 1: إضافة صورة الفريم

ضع صورة PNG شفافة في مجلد `assets/frames/`:

```
assets/frames/frame4.png
```

### الخطوة 2: إضافة الإعدادات

أضف كائنًا جديدًا في `config/frames.json`:

```json
{
  "id": "frame4",
  "name": "الفريم الجديد",
  "image": "assets/frames/frame4.png",
  "canvasWidth": 1080,
  "canvasHeight": 1080,
  "text": {
    "name": {
      "x": 540,
      "y": 800,
      "fontSize": 42,
      "fontWeight": "bold",
      "color": "#FFFFFF",
      "align": "center"
    },
    "title": {
      "x": 540,
      "y": 850,
      "fontSize": 28,
      "fontWeight": "normal",
      "color": "#FFFFFF",
      "align": "center"
    },
    "details": {
      "x": 540,
      "y": 900,
      "fontSize": 22,
      "fontWeight": "normal",
      "color": "#FBAE42",
      "align": "center"
    }
  }
}
```

### تغيير أماكن النص

عدّل قيم `x` و `y` في إعدادات كل frame لتحديد مكان النص:

- `x`: الموقع الأفقي (بالبكسل من اليسار)
- `y`: الموقع العمودي (بالبكسل من الأعلى)
- `fontSize`: حجم الخط
- `color`: لون النص (hex)
- `align`: محاذاة النص (right, center, left)
- `fontWeight`: سمك الخط (normal, bold)

## Customization

### تغيير الألوان

عدّل المتغيرات في `css/style.css`:

```css
:root {
  --color-primary: #014976;      /* الأزرق الرئيسي */
  --color-accent: #FBAE42;       /* البرتقالي */
  --color-bg: #F4F3EF;          /* خلفية الصفحة */
}
```

## Tech Stack

- HTML5
- CSS3 (Custom Properties, Grid, Flexbox)
- JavaScript ES6+ (Modules)
- Fabric.js (Canvas manipulation)
- Cairo + Tajawal fonts (Google Fonts)

## Privacy

جميع المعالجات تحدث داخل المتصفح. لا تتم أي عملية رفع صور إلى خوادم خارجية.

## License

MIT License
