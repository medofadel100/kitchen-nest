# 🪚 KitchenNest

**KitchenNest** is a specialized B2B SaaS platform designed specifically for carpentry and kitchen workshops in Egypt. It streamlines the entire process from kitchen design to production by providing precise 3D visualization, accurate cutting lists, real-world material nesting, and exact pricing based on actual material usage.

---

## 🌟 Key Features

### 1. 📐 Precision Cutting Lists
Automatically generates exact cutting dimensions for every part of a kitchen unit (sides, top, bottom, back, shelves, doors, drawer fronts).
- Supports standard 18mm board thicknesses (customizable per material).
- Rounds dimensions for practical manufacturing (e.g., doors and drawer fronts rounded to the nearest millimeter).

### 2. 🧩 Real-World Nesting Algorithm (Guillotine)
Unlike theoretical area calculations, KitchenNest uses a **Guillotine Bin Packing** algorithm to calculate how parts actually fit onto standard wood sheets.
- Fully supports edge banding calculations.
- Accounts for saw blade thickness (Saw Kerf) between cuts.
- Calculates nesting per material independently to prevent mixing parts on the same board.
- Maximizes sheet utilization and minimizes waste.

### 3. 💰 Accurate Pricing Engine
Calculates costs based on the **actual number of sheets required**, not just fractional square meters. If a job requires 3.2 sheets, the system correctly prices it for 4 full sheets.
- Includes costs for accessories, edge banding, hardware, and profit margins.

### 4. 🎨 Interactive 3D & 2D Canvas
- Intuitive drag-and-drop interface for kitchen units.
- 3D visualization of appliances (ovens, range hoods, etc.) with precise cutout dimensions.
- Snap-to-grid features based on standard Egyptian carpentry widths.

### 5. 🖨️ Production & Client Exports
- Generate professional PDF quotes for clients (without internal manufacturing details).
- Export detailed cutting sheets and QR labels for internal workshop use.
- CNC DXF Export capabilities.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Language:** TypeScript (Strict Mode)
- **Database / Auth:** Firebase & Firestore
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

---

## 📂 Project Structure (Core Logic)

The core logic has been built with testability and precision in mind:
- `src/types/index.ts`: TypeScript definitions for Materials, Kitchen Units, Cut Pieces, and Nesting Results.
- `src/lib/cuttingList.ts`: Transforms a 3D unit into a detailed list of cut pieces.
- `src/lib/nesting.ts`: The Guillotine nesting engine.
- `src/lib/pricing.ts`: Calculates the final project cost combining materials, nesting results, and margins.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/medofadel100/kitchen-nest.git
   ```
2. Navigate to the project directory:
   ```bash
   cd kitchen-nest
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Setup Environment Variables:
   Create a `.env.local` file and add your Firebase credentials.
   
5. Run the development server:
   ```bash
   npm run dev
   ```

### 🧪 Testing Core Logic
You can test the nesting, cutting list, and pricing logic without the UI by running the test script:
```bash
npx tsx scripts/test-core-logic.ts
```

---

## ⚠️ Important Development Notes
- **Placeholder Prices:** The prices in `src/data/materials.ts` are placeholders for testing purposes. Do not use them as real market prices.
- **Next.js Versioning:** Always ensure the project uses a patched version of Next.js 14 (avoid `14.2.5` due to known vulnerabilities).

---

## 📄 License
This project is proprietary and intended for specialized use.
