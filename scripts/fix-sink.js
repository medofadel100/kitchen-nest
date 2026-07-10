const fs = require('fs');
const content = fs.readFileSync('src/components/canvas/KitchenCanvas3D.tsx', 'utf8');

// Remove the duplicate sink rendering block
const fixed = content.replace(
  /if \(isSink\) \{\s+details\.push\(\s+<group key="sink-group" position=\[\{0, h\/2 \+ counterT, 0\.01\}\]>\s+<Appliance3D type="sink" width=\{w\} height=\{0\.01\} depth=\{d\} \/>\s+<\/group>\s+\);\s+\}/,
  '// Sink removed - duplicate rendering fixed'
);

fs.writeFileSync('src/components/canvas/KitchenCanvas3D.tsx', fixed);
console.log('Fixed!');