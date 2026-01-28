/**
 * Ontology data for visualizing product relationships using Mermaid diagrams
 */

export interface OntologySection {
  id: string;
  title: string;
  code: string;
}

export const ontologyData: OntologySection[] = [
  {
    id: 'master',
    title: 'Product Ontology Overview',
    code: `
      flowchart TB
        subgraph Product["🎒 AURORA BAG"]
          BODY["Body"]
          HANDLE["Handle"]
          HARDWARE["Hardware"]
          CHARM["Charm"]
        end
        
        Product --> Materials
        Product --> Configuration
        Product --> Personalization
        
        subgraph Materials["Materials"]
          LEATHER["Leather Type"]
          FINISH["Surface Finish"]
          COLOR["Color Options"]
        end
        
        subgraph Configuration["Configuration"]
          SIZE["Size Options"]
          STRAP["Strap Config"]
          CLASP["Closure Type"]
        end
        
        subgraph Personalization["Personalization"]
          MONO["Monogram"]
          TAG["Tags & Charms"]
          PRINT["Custom Print"]
        end
    `
  },
  {
    id: 'materials',
    title: '1. Materials Hierarchy',
    code: `
      flowchart LR
        LEATHER["Leather"]
        
        LEATHER --> CALFSKIN["Calfskin"]
        LEATHER --> LAMBSKIN["Lambskin"]
        LEATHER --> VEGAN["Vegan Leather"]
        
        CALFSKIN --> SMOOTH["Smooth"]
        CALFSKIN --> PEBBLED["Pebbled"]
        CALFSKIN --> SUEDE["Suede"]
        
        SMOOTH --> NAT["Natural"]
        SMOOTH --> WAXED["Waxed"]
        
        style LEATHER fill:#F8F5F0,stroke:#000
        style CALFSKIN fill:#fff,stroke:#000
        style SMOOTH fill:#fff,stroke:#000
    `
  },
  {
    id: 'body',
    title: '2. Body Configuration',
    code: `
      flowchart TB
        BODY["Body Component"]
        
        BODY --> MATERIAL["Material Selection"]
        BODY --> TREATMENT["Surface Treatment"]
        BODY --> DECORATION["Decoration"]
        
        MATERIAL --> MT_SMOOTH["Smooth Leather"]
        MATERIAL --> MT_PEBBLE["Pebbled Leather"]
        
        TREATMENT --> TR_NAT["Natural"]
        TREATMENT --> TR_WAX["Waxed"]
        
        DECORATION --> DEC_NONE["None"]
        DECORATION --> DEC_MONO["Monogram"]
        DECORATION --> DEC_PRINT["Custom Print"]
        
        style BODY fill:#C20000,stroke:#000,color:#fff
    `
  },
  {
    id: 'handle',
    title: '3. Handle Configuration',
    code: `
      flowchart TB
        HANDLE["Handle Component"]
        
        HANDLE --> STYLE["Style"]
        HANDLE --> HMAT["Material"]
        HANDLE --> SIZE["Size"]
        
        STYLE --> ST_SINGLE["Single Strap"]
        STYLE --> ST_DOUBLE["Double Handle"]
        STYLE --> ST_CROSS["Crossbody"]
        
        HMAT --> HM_MATCH["Match Body"]
        HMAT --> HM_CONTRAST["Contrast"]
        HMAT --> HM_CHAIN["Chain"]
        
        SIZE --> SZ_STD["Standard"]
        SIZE --> SZ_EXT["Extended"]
        
        HM_CHAIN -.->|"Constraint"| NO_PRINT["No Custom Print"]
        
        style HANDLE fill:#C20000,stroke:#000,color:#fff
        style NO_PRINT fill:#fee,stroke:#c00
    `
  },
  {
    id: 'hardware',
    title: '4. Hardware & Closure',
    code: `
      flowchart LR
        HW["Hardware"]
        
        HW --> FINISH["Finish"]
        HW --> CLOSURE["Closure Type"]
        
        FINISH --> F_GOLD["Gold/Brass"]
        FINISH --> F_SILVER["Silver"]
        FINISH --> F_MATTE["Matte Black"]
        
        F_GOLD --> FG_ANT["Antique"]
        F_GOLD --> FG_POL["Polished"]
        
        CLOSURE --> CL_MAG["Magnetic"]
        CLOSURE --> CL_TURN["Turnlock"]
        CLOSURE --> CL_ZIP["Zipper"]
        
        style HW fill:#F8F5F0,stroke:#000
    `
  },
  {
    id: 'constraints',
    title: '5. Constraint Rules',
    code: `
      flowchart TB
        subgraph Constraints["Business Rules"]
          C1["Chain Handle → No Print"]
          C2["Calfskin → Limited Colors"]
          C3["Suede → No Wax Treatment"]
        end
        
        subgraph Pricing["Price Modifiers"]
          P1["Extended Handle: +£25"]
          P2["Chain Handle: +£45"]
          P3["Custom Print: +£35"]
          P4["Monogram: +£20"]
        end
        
        Constraints --> Validation["Config Validation"]
        Pricing --> Total["Total Price Calculation"]
        
        style Constraints fill:#fee,stroke:#c00
        style Pricing fill:#efe,stroke:#0a0
    `
  }
];


