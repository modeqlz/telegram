const fs = require('fs');

const appContent = fs.readFileSync('d:/my project/telegram/src/App.jsx', 'utf-8');
const lines = appContent.split(/\r?\n/);

const detailsView = lines.slice(332, 421).join('\n');
const adminView = lines.slice(422, 1010).join('\n');
const profileView = lines.slice(1011, 1165).join('\n');
const dressupView = lines.slice(1168, 1528).join('\n');

const pDetails = `import React, { useState } from 'react';\nimport { ArrowLeft, Heart, Minus, Plus } from 'lucide-react';\n\n` + detailsView.replace(/function DetailsView/, 'export function DetailsView') + `\n`;

const pAdmin = `import React, { useState, useEffect } from 'react';\nimport { Search, ChevronRight, User, Package, UploadCloud, Edit2, Trash2, X, ArrowLeft } from 'lucide-react';\nimport { supabase } from '../supabaseClient';\nimport { CATEGORIES } from '../constants';\n\n` + adminView.replace(/function AdminView/, 'export function AdminView') + `\n`;

const pProfile = `import React, { useState, useEffect } from 'react';\nimport { User, Package, ChevronRight, Info, HelpCircle, Edit2, X, Truck, Zap, CreditCard } from 'lucide-react';\nimport { supabase } from '../supabaseClient';\n\n` + profileView.replace(/function ProfileView/, 'export function ProfileView') + `\n`;

const pDressup = `import React, { useState, useEffect, useRef } from 'react';\nimport { X } from 'lucide-react';\n\n` + dressupView.replace(/function DressupView/, 'export function DressupView') + `\n`;

fs.writeFileSync('d:/my project/telegram/src/components/DetailsView.jsx', pDetails);
fs.writeFileSync('d:/my project/telegram/src/components/AdminView.jsx', pAdmin);
fs.writeFileSync('d:/my project/telegram/src/components/ProfileView.jsx', pProfile);
fs.writeFileSync('d:/my project/telegram/src/components/DressupView.jsx', pDressup);

let topHalf = lines.slice(0, 331);
let bottomHalf = lines.slice(1528);

const newImports = [
  "import { DetailsView } from './components/DetailsView';",
  "import { AdminView } from './components/AdminView';",
  "import { ProfileView } from './components/ProfileView';",
  "import { DressupView } from './components/DressupView';"
];

let lastImportIdx = -1;
for (let i = 0; i < topHalf.length; i++) {
  if (topHalf[i].startsWith('import ')) {
    lastImportIdx = i;
  }
}
topHalf.splice(lastImportIdx + 1, 0, ...newImports);

const newApp = topHalf.join('\n') + '\n\n' + bottomHalf.join('\n');
fs.writeFileSync('d:/my project/telegram/src/App.jsx', newApp);
console.log('SUCCESS');
