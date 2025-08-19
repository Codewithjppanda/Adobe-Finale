# Document Intelligence - Design System

## 🎨 Premium Homepage Design with Aceternity UI & Magic UI

This project features a completely redesigned homepage using premium UI components from Aceternity UI and Magic UI, following Apple-like minimalism with Stripe polish.

## 🚀 Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** with custom design tokens
- **Framer Motion** for smooth animations
- **Aceternity UI** for premium animations
- **Magic UI** for modern interactions
- **Lucide Icons** for consistency

## 🎯 Design Philosophy

### Visual System
- **Aesthetic**: Apple-like minimalism + Stripe polish
- **Whitespace**: Generous spacing throughout
- **Grid**: Clean 12-column system on desktop
- **Motion**: Restrained but impactful animations

### Typography
- **Display**: Plus Jakarta Sans (500, 600, 700) for headlines
- **UI**: Inter (400, 500, 600, 700) for body text
- **Tracking**: Tight tracking for H1/H2

### Color Tokens
```css
/* Light Mode */
--bg: #FFFFFF
--surface: #F7F7FB  
--text: #0B0B11
--text-muted: #6B7280
--stroke: #E8E8EF

/* Dark Mode */  
--bg: #0B0B11
--surface: #11121A
--text: #EDEDF2
--text-muted: #9CA3AF
--stroke: #1F2030

/* Accent Gradient */
--accent-primary: #8B5CF6 (Purple)
--accent-secondary: #22D3EE (Cyan)  
--accent-tertiary: #60A5FA (Blue)
```

## 🧩 Component Architecture

### Aceternity UI Components
- **Spotlight**: Hero background effect
- **Meteors**: Subtle animated background elements
- **FloatingNav**: Glass morphism navigation that appears on scroll

### Magic UI Components  
- **BentoGrid**: Modern card layout system
- **Marquee**: Smooth scrolling feature tags
- **AnimatedGradientText**: Gradient text with glow effects
- **OrbitingCircles**: Rotating elements around demo mockup
- **Globe**: Interactive 3D globe with markers and auto-rotation

### Premium Features
- **Glass Morphism**: Backdrop blur effects
- **Gradient Animations**: Smooth color transitions
- **Spring Animations**: Micro-interactions with spring physics
- **Premium Shadows**: Depth with blur effects

## 📂 File Structure

```
frontend/
├── components/
│   ├── aceternity/          # Aceternity UI components
│   │   ├── floating-navbar.tsx
│   │   ├── spotlight.tsx
│   │   └── meteors.tsx
│   ├── magicui/            # Magic UI components  
│   │   ├── bento-grid.tsx
│   │   ├── marquee.tsx
│   │   ├── animated-gradient-text.tsx
│   │   └── orbiting-circles.tsx
│   └── ui/                 # Base UI components
│       └── Container.tsx
├── app/
│   ├── page.tsx           # New premium homepage
│   └── layout.tsx         # Font configuration
└── src/app/
    └── globals.css        # Design tokens & animations
```

## 🎬 Animations & Interactions

### Hero Section
- **Spotlight**: Animated spotlight effect on hero background  
- **Meteors**: Subtle falling meteor animation
- **Orbiting Circles**: Rotating icons around demo mockup
- **Gradient Text**: Animated gradient flow on headline

### Features Section  
- **Bento Grid**: Hover lift animations with scale transforms
- **Marquee**: Smooth infinite scroll of feature tags
- **Entrance**: Staggered fade-in animations

### Navigation
- **Floating Nav**: Glass morphism nav that slides in on scroll
- **Hover States**: Smooth underline animations
- **Theme Toggle**: Animated theme switching

## 🛠 Setup Instructions

### 1. Install Dependencies
```bash
npm install framer-motion lucide-react clsx tailwind-merge
```

### 2. Font Configuration
Fonts are configured in `app/layout.tsx` using Next.js Google Fonts:
- Inter (400, 500, 600, 700) 
- Plus Jakarta Sans (500, 600, 700)

### 3. Design Tokens
All design tokens are defined in `src/app/globals.css` including:
- Color variables for light/dark modes
- Typography utilities
- Animation keyframes
- Component styles

### 4. Component Usage

#### Aceternity UI Examples
```tsx
// Spotlight background
<Spotlight className="top-40 left-0 md:left-60" fill="rgb(139, 92, 246)" />

// Floating navigation  
<FloatingNav navItems={navItems} />

// Meteors animation
<Meteors number={20} />
```

#### Magic UI Examples
```tsx
// Bento grid layout
<BentoGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  <BentoCard gradient>Content</BentoCard>
</BentoGrid>

// Animated gradient text
<AnimatedGradientText as="h1">
  AI-Powered Document Analysis  
</AnimatedGradientText>

// Scrolling marquee
<Marquee pauseOnHover speed={35}>
  <div>Feature tags...</div>
</Marquee>
```

## 🎨 Design Guidelines

### Component Styling
- **Rounded corners**: rounded-2xl (16px) for cards
- **Padding**: 16-24px internal spacing
- **Shadows**: Premium depth with `shadow-premium` utility
- **Borders**: Subtle stroke colors with transparency

### Animations
- **Duration**: 200-300ms for micro-interactions
- **Easing**: Spring animations for organic feel
- **Reduced Motion**: Respects `prefers-reduced-motion`

### Accessibility
- **Contrast**: ≥4.5:1 color contrast ratios
- **Focus**: Visible focus rings on all interactive elements
- **Keyboard**: Full keyboard navigation support
- **Screen Readers**: Proper ARIA labels and live regions

## 🚀 Performance Optimizations

- **Font Loading**: `display=swap` for better CLS scores
- **Image Optimization**: next/image for responsive images  
- **Code Splitting**: Dynamic imports for non-critical components
- **CSS**: Optimized with Tailwind CSS purging

## 📱 Responsive Design

- **Mobile First**: Designed for 360px+ screens
- **Breakpoints**: Uses Tailwind's responsive system
- **Touch Targets**: 44px minimum for mobile interactions
- **Content**: Properly scales across all screen sizes

## 🎯 Lighthouse Targets

- **Performance**: ≥95
- **Accessibility**: ≥95  
- **Best Practices**: ≥95
- **SEO**: ≥95
- **CLS**: <0.05

## 🔧 Customization

### Adding New Components
1. Create component in appropriate directory (`aceternity/` or `magicui/`)
2. Follow existing naming conventions
3. Include TypeScript interfaces
4. Add proper accessibility attributes

### Color Customization
Update CSS variables in `src/app/globals.css`:
```css
:root {
  --accent-primary: #your-color;
  --accent-secondary: #your-color;
  --accent-tertiary: #your-color;
}
```

### Animation Customization
Modify keyframes in `globals.css` or add new Framer Motion variants in components.

## 📖 Resources

- [Aceternity UI Components](https://ui.aceternity.com)
- [Magic UI Components](https://magicui.design)  
- [Framer Motion Documentation](https://www.framer.com/motion)
- [Tailwind CSS Documentation](https://tailwindcss.com)

---

*Built with ❤️ using premium UI libraries for a truly exceptional user experience.*
