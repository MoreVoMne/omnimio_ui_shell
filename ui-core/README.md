# Omnimio UI

Exported UI components from the Omnimio project.

## Quick Start

```bash
# Install dependencies
npm install

# Run dev server
npm run dev
```

The app will be available at `http://127.0.0.1:8000`

## Structure

```
ui-export/
├── components/          # React components
│   ├── capability-wizard/   # Wizard components
│   └── ...
├── utils/               # Helper functions
├── fonts/               # Custom fonts (PP Editorial)
├── types*.ts            # TypeScript types
├── constants.ts         # App constants
├── layoutData.ts        # Layout configuration
├── ontologyData.ts      # Ontology data
├── productCatalog.ts    # Product catalog data
├── index.css            # Global styles (Tailwind)
├── App.tsx              # Main app component
└── index.tsx            # Entry point
```

## Key Dependencies

- **React 18** — UI framework
- **Framer Motion** — Animations
- **Lucide React** — Icons
- **Three.js + R3F** — 3D rendering
- **Tailwind CSS** — Styling
- **Fabric.js** — Canvas manipulation

## Integration into Another Project

### Option 1: Copy Components Only

Copy the `components/` folder and install the dependencies:

```bash
npm install framer-motion lucide-react
```

### Option 2: Full Integration

1. Copy all files to your project
2. Merge `package.json` dependencies
3. Import components as needed:

```tsx
import { SpecSentence } from './components/SpecSentence';
import { IdentityTagV2 } from './components/IdentityTagV2';
```

## Notes

- Tailwind CSS is configured via `index.css` with `@tailwind` directives + `tailwind.config.js`
- Custom fonts are in `fonts/` — update paths in CSS if needed
- 3D components require `@react-three/fiber` and `@react-three/drei`

