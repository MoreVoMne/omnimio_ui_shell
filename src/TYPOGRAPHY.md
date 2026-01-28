# Typography System

This document describes the typography system used across the application.

## Quick Reference

### CSS Classes (Recommended)

Use these classes directly in your JSX:

```tsx
// Mono text (JetBrains Mono, uppercase)
<span className="text-mono-xs">8px tiny label</span>
<span className="text-mono-sm">9px button text</span>
<span className="text-mono-base">10px default</span>
<span className="text-mono-md">12px medium</span>
<span className="text-mono-body">responsive body</span>
<span className="text-mono-body-caps">responsive uppercase</span>
<span className="text-mono-header">section header</span>

// Serif text (PP Editorial Old)
<span className="text-serif-base">16px base</span>
<span className="text-serif-lg">18px large</span>
<span className="text-serif-xl">20px modal heading</span>
<span className="text-serif-2xl">24px</span>
<span className="text-serif-title">responsive page title</span>

// Colors
<span className="text-mono-base text-muted">muted (60% opacity)</span>
<span className="text-mono-base text-muted-light">light muted (40%)</span>
<span className="text-mono-base text-muted-medium">medium muted (70%)</span>

// Buttons
<button className="text-btn">button text</button>
<button className="text-btn-sm">small button</button>

// Links
<a className="text-link">link with underline</a>
```

### React Components (Alternative)

Import from `@/components/ui/Typography`:

```tsx
import { Text } from '@/components/ui/Typography';

// Mono text
<Text.Mono>Default 10px</Text.Mono>
<Text.Mono size="sm">9px button size</Text.Mono>
<Text.Mono size="body">Responsive body</Text.Mono>
<Text.Mono muted>Muted text</Text.Mono>

// Serif text
<Text.Serif size="xl">Modal heading</Text.Serif>
<Text.Serif size="title">Page title</Text.Serif>

// Specialized
<Text.Heading level={1}>Page Title</Text.Heading>
<Text.SectionHeader>SECTION</Text.SectionHeader>
<Text.Body>Responsive body text</Text.Body>
<Text.Link onClick={...}>Click me</Text.Link>
<Text.Label htmlFor="input">Label</Text.Label>
```

## Size Reference

### Mono Text Sizes

| Class | Size | Use Case |
|-------|------|----------|
| `text-mono-xs` | 8px | Tiny labels, badges |
| `text-mono-sm` | 9px | Buttons, dropdowns |
| `text-mono-base` | 10px | Default UI text |
| `text-mono-md` | 12px | Modal headings |
| `text-mono-body` | 10px → 12px → 14px | Responsive body |
| `text-mono-body-caps` | Same + uppercase | Responsive labels |
| `text-mono-header` | 10px + 0.3em tracking | Section headers |

### Serif Text Sizes

| Class | Size | Use Case |
|-------|------|----------|
| `text-serif-base` | 16px | Input text |
| `text-serif-lg` | 18px | Option names |
| `text-serif-xl` | 20px | Modal headings |
| `text-serif-2xl` | 24px | Large headings |
| `text-serif-title` | 24px → 30px → 36px | Page titles |

## Migration Guide

### Before (Inline Tailwind)

```tsx
// ❌ Don't do this anymore
<p className="font-mono text-[10px] uppercase tracking-widest text-charcoal">
  Label
</p>

<h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-charcoal">
  Title
</h1>

<button className="font-mono text-[9px] uppercase tracking-widest">
  Click
</button>
```

### After (Typography System)

```tsx
// ✅ Do this instead
<p className="text-mono-base text-charcoal">
  Label
</p>

<h1 className="text-serif-title text-charcoal">
  Title
</h1>

<button className="text-btn">
  Click
</button>
```

## Common Patterns

### Page Header

```tsx
<h1 className="text-serif-title text-charcoal">
  Page Title
</h1>
```

### Section Header

```tsx
<div className="text-mono-header text-charcoal">
  SECTION NAME
</div>
```

### Body Text

```tsx
<p className="text-mono-body text-charcoal">
  Responsive body text that scales with screen size.
</p>
```

### Muted Label

```tsx
<span className="text-mono-base text-muted">
  Secondary information
</span>
```

### Button

```tsx
<button className="px-4 py-2 border border-charcoal text-btn bg-charcoal text-cream">
  Primary Button
</button>
```

### Link

```tsx
<a className="text-link" href="#">
  View details
</a>
```

## Spacing System

Centralized spacing classes for consistent padding across the app.

### Content Padding

```tsx
// Standard content padding (no top)
<div className="content-padding">px-6 pb-6 → px-8 pb-8 → px-12 pb-12</div>

// Content padding with top
<div className="content-padding-full">pt-6 px-6 pb-6 → ...</div>

// Sticky header padding
<div className="sticky-padding">pt-6 px-6 pb-4 → pt-5 px-8 pb-5 → pt-6 px-12 pb-6</div>

// Panel padding (cards, side panels)
<div className="panel-padding">p-4 → p-6 → p-8</div>
<div className="panel-padding-x">px-4 → px-6 → px-8</div>
<div className="panel-padding-b">pb-4 → pb-6 → pb-8</div>
```

### Breaking Out of Containers

```tsx
// Break out horizontally
<div className="break-content-x">-mx-6 → -mx-8 → -mx-12</div>

// Break out horizontally and bottom
<div className="break-content">-mx-6 -mb-6 → ...</div>

// Break out all sides including top
<div className="break-content-full">-mx-6 -mb-6 -mt-6 → ...</div>
```

## Files

- **CSS Classes**: `src/index.css` (under `@layer components`)
- **React Components**: `src/components/ui/Typography.tsx`
- **Example Usage**: `src/components/layout/StandardLayout.tsx`
