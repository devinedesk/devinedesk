---
name: devinedesk
description: Open-source AI image, video, cinema and lip sync studio
colors:
  primary: '#22d3ee'
  primary-hover: '#06b6d4'
  neutral-app-bg: '#030303'
  neutral-panel-bg: '#0a0a0a'
  neutral-card-bg: '#111111'
  neutral-secondary: '#a1a1aa'
  neutral-muted: '#52525b'
  neutral-border-glass: 'rgba(255, 255, 255, 0.08)'
typography:
  body:
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
rounded:
  xl: '0.75rem'
  2xl: '1.5rem'
  3xl: '2rem'
---

# Design System: devinedesk

## Overview

**Creative North Star: "The Unbound Darkroom"**

Focused on limitless creative control, deep blacks, and striking neon accents, the devinedesk interface is immersive and bold. The UI recedes into deep darkness, letting the high-quality generated media and vibrant cyan accents take center stage. There is no unnecessary clutter, focusing entirely on a professional and expansive environment for seamless AI media creation.

**Key Characteristics:**

- Deep dark backgrounds (#030303 to #111111) to emphasize media.
- Vibrant, energetic "Electric Cyan" accents.
- Luminous glass panels with subtle border outlines.
- Minimalist typography using Inter.

## Colors

The palette is anchored in deep, cinematic darkness pierced by energetic neon accents.

### Primary

- **Electric Cyan** (#22d3ee): A bright, energetic, and futuristic neon blue that signifies action, AI generation, and active selection.
- **Electric Cyan Hover** (#06b6d4): A slightly deeper cyan for interaction states.

### Neutral

- **App Background** (#030303): The deepest black for the main canvas, letting media pop.
- **Panel Background** (#0a0a0a): Slightly elevated dark gray for sidebars and tool panels.
- **Card Background** (#111111): The highest elevated dark surface for content cards.
- **Secondary Text** (#a1a1aa): Muted text for labels and secondary information.
- **Muted Elements** (#52525b): For disabled states or subtle dividers.
- **Glass Border** (rgba(255, 255, 255, 0.08)): Used to define the edges of floating glass panels against the dark void.

### Named Rules

**The Void Rule.** The background should remain as dark as possible (#030303). Do not use light grays for large surface areas; elevation is achieved through subtle lightness shifts and glassmorphism.

## Typography

**Body Font:** 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif

**Character:** Clean, legible, and unobtrusive. The typography is purely utilitarian, ensuring the user's focus remains on the visual media and workflows.

### Hierarchy

- **Body** (400, base): Standard UI text, labels, and paragraph content.

## Layout

The layout is built for complex workflows, featuring a highly technical but uncluttered spatial model. The system relies on custom scrollbars (thin and subtle) to manage dense toolsets without breaking the visual immersion.

## Elevation & Depth

Luminous and layered. Backgrounds are deep and flat, but active elements and glass panels float above them, using cyan "glow" shadows for emphasis and selection, while large dark shadows (3xl) ground major modals.

### Shadow Vocabulary

- **Glow** (`0 0 20px rgba(34, 211, 238, 0.4)`): Ambient emission for active states and primary actions.
- **Glow Accent** (`0 0 20px rgba(168, 85, 247, 0.4)`): Ambient emission for secondary or specialized active states.
- **Modal 3xl** (`0 35px 60px -15px rgba(0, 0, 0, 0.8)`): Deep grounding shadow for floating dialogs and modals over the app background.

## Shapes

Precise and atmospheric. The system utilizes generous border radii (0.75rem to 2rem) combined with glassmorphism (`backdrop-filter: blur(12px)`) and subtle thin white borders (`rgba(255,255,255,0.08)`) to create a sleek, lightweight form language.

## Components

Components use glassmorphism and subtle thin borders to feel sleek and lightweight, lighting up with Electric Cyan when active.

### Cards / Glass Panels

- **Corner Style:** Rounded xl (0.75rem).
- **Background:** `rgba(255, 255, 255, 0.03)` with `backdrop-filter: blur(12px)`.
- **Border:** 1px solid `rgba(255, 255, 255, 0.08)`.

### Scrollbars

- **Style:** Custom thin scrollbars (`width: 4px`), track is transparent, thumb is subtle white (`rgba(255,255,255,0.1)`) with `2px` border radius.

## Do's and Don'ts

### Do:

- **Do** use Electric Cyan (#22d3ee) sparingly, only for primary actions, active states, or generation triggers.
- **Do** maintain the deep dark background (#030303) as the canvas for all media.
- **Do** use glassmorphism (translucency + blur) for floating panels.

### Don't:

- **Don't** use solid bright backgrounds for structural elements; rely on the dark neutrals.
- **Don't** overcomplicate the typography; stick to Inter with clean weights.
