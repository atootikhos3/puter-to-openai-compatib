# Zenith SEO - Landing Page Design Spec

## 1. Project Overview
- **Name:** Zenith SEO
- **Aesthetic:** Apple-style Minimalist (Dark Mode)
- **Stack:** HTML5, CSS3, Vanilla JS
- **Location:** `public/` directory

## 2. File Structure
```
public/
├── index.html       # Main structure
├── css/
│   └── style.css    # Global styles, variables, media queries
└── js/
    └── main.js      # Animation logic, scroll observers
```

## 3. Design System

### Colors (Dark Mode)
- **Background:** `#000000` (Deep Black)
- **Surface:** `#1d1d1f` (Dark Grey cards)
- **Text Primary:** `#f5f5f7` (Off-white)
- **Text Secondary:** `#86868b` (Light Grey)
- **Accent:** `#2997ff` (Apple Blue) or Gradient `linear-gradient(90deg, #0071e3, #9b51e0)`

### Typography
- **Font Family:** `-apple-system, BlinkMacSystemFont, "Inter", sans-serif`
- **Headings:** Large, bold, tracking-tight (`-0.01em` to `-0.03em`).
- **Body:** High readability, line-height 1.6, font-size 18px-21px.

### Visual Elements
- **Glassmorphism:** `backdrop-filter: blur(20px); background: rgba(29, 29, 31, 0.7);`
- **Cards:** Rounded corners (`border-radius: 24px`), subtle borders (`1px solid rgba(255,255,255,0.1)`).
- **Whitespace:** Generous padding (sections: `120px 0`).

## 4. HTML Structure (Sections)

### 1. Header (`header.site-header`)
- **Structure:** `<nav>` with Flexbox.
- **Logo (Left):** "Zenith" (Clean sans-serif text).
- **Links (Center):** Expertise, Outcomes, Method.
- **CTA (Right):** "Free Audit" (Pill-shaped button with blur).

### 2. Hero Section (`section#hero`)
- **Alignment:** Center-aligned text, vertically centered.
- **Content:**
    - `h1`: "Engineered for Dominance." (Staggered fade-in).
    - `p.subheadline`: "The precision of code meets the art of ranking."
    - `div.cta-group`: "Start Growth" (Primary) + "Our Logic" (Link).
- **Visual:** Background subtle gradient mesh or animated canvas grid (using CSS gradients for simplicity).

### 3. Features Grid (`section#expertise`)
- **Layout:** CSS Grid "Bento Box" style.
- **Cards:**
    1.  **Technical:** "Core Web Vitals Obsessed." (Icon: Speedometer/Lightning)
    2.  **Content:** "Semantic Authority." (Icon: Document/Structure)
    3.  **Analytics:** "Data, not guesses." (Icon: Graph)

### 4. Results / Data (`section#results`)
- **Background:** Darker contrast.
- **Content:**
    - Animated Counter: `+240%` Traffic Growth.
    - Animated Counter: `#1` Keywords Secured.
    - Graph graphic (CSS/SVG) simply showing an upward trend line.

### 5. Services (`section#services`)
- **Layout:** Alternating text + visual split or large list items.
- **Content:** Audit, Strategy, Content, Backlinks.

### 6. Contact / CTA (`section#contact`)
- **Content:** Simple headline "Ready to Ascend?" and a minimalist form or mailto link.

### 7. Footer
- **Content:** Simple grid with links. Low contrast text.

## 5. Interaction & Animation (JS + CSS)

### CSS Transitions
- **Classes:**
    - `.fade-up`: Initial state `opacity: 0; transform: translateY(40px);`
    - `.visible`: Final state `opacity: 1; transform: translateY(0);`
- **Timing:** `transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);` (Apple's easing).

### JavaScript (`main.js`)
1.  **Intersection Observer:** Watch all elements with `.reveal-on-scroll`. Add `.visible` class when 10% in viewport.
2.  **Navbar Scroll:** Add `.scrolled` class to header when `scrollY > 20` to activate blur background.
3.  **Parallax (Optional):** Slight Y-axis movement on Hero background elements.