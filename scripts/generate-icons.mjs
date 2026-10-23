#!/usr/bin/env node
/**
 * Generator koleksi ikon offline.
 *
 * Hasil: resources/js/lib/offline-icons.ts (file ini di-commit, jangan diedit manual).
 *
 * Tujuan: aplikasi memakai Content-Security-Policy `default-src 'self'`,
 * sehingga fetch runtime ke api.iconify.design (api.unisvg.com / api.simplesvg.com)
 * oleh @iconify/react akan diblokir browser dan ikon tidak muncul.
 * Dengan file ini, seluruh ikon yang dipakai dibundel dari @iconify/json
 * dan didaftarkan lewat addCollection() di resources/js/app.tsx.
 *
 * Jalankan otomatis lewat `npm run build` dan `npm run dev` (predev),
 * atau manual: npm run generate-icons
 *
 * Bila menambahkan set ikon baru (mis. "tabler"), tambahkan prefix-nya ke
 * PREFIXES di bawah — build akan gagal otomatis bila nama ikon tidak valid.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'resources', 'js');
const outFile = path.join(srcDir, 'lib', 'offline-icons.ts');

/** Set ikon Iconify yang dipakai aplikasi. */
const prefixes = ['lucide'];

/** Ekstensi file sumber yang dipindai. */
const scanExtensions = new Set(['.ts', '.tsx', '.js', '.jsx']);

/** Token "prefix:nama" — dipakai untuk menemukan pemakaian ikon di kode. */
const tokenPattern = /\b([a-z][a-z0-9-]*):([a-z0-9-]+)\b/g;

/** Konteks prop ikon, untuk mendeteksi set ikon yang belum terdaftar. */
const iconPropPattern = /(?:icon\s*=\s*|icon:\s*)['"`]?([a-z][a-z0-9-]*):([a-z0-9-]+)/g;

const fail = (message) => {
    console.error(`\n[generate-icons] GAGAL: ${message}\n`);
    process.exit(1);
};

// ---------------------------------------------------------------------------
// 1. Baca data ikon dari @iconify/json
// ---------------------------------------------------------------------------
const collections = new Map();

for (const prefix of prefixes) {
    const jsonPath = path.join(root, 'node_modules', '@iconify', 'json', 'json', `${prefix}.json`);
    if (!fs.existsSync(jsonPath)) {
        fail(`data ikon "${prefix}" tidak ditemukan di ${jsonPath}. Jalankan "npm install" terlebih dulu.`);
    }

    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    collections.set(prefix, { icons: data.icons ?? {}, aliases: data.aliases ?? {} });
}

// ---------------------------------------------------------------------------
// 2. Pindai sumber untuk menemukan pemakaian ikon
// ---------------------------------------------------------------------------
const sourceFiles = [];

const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(full);
        } else if (entry.isFile() && scanExtensions.has(path.extname(entry.name)) && full !== outFile) {
            sourceFiles.push(full);
        }
    }
};

walk(srcDir);

/** prefix -> Set(nama ikon) */
const used = new Map(prefixes.map((prefix) => [prefix, new Set()]));
const problems = [];

for (const file of sourceFiles) {
    const code = fs.readFileSync(file, 'utf8');
    const relative = path.relative(root, file);

    // a. token "lucide:nama" di mana pun dalam kode
    for (const match of code.matchAll(tokenPattern)) {
        const [, prefix, name] = match;
        if (!collections.has(prefix)) continue;

        const { icons, aliases } = collections.get(prefix);
        if (!icons[name] && !aliases[name]) {
            problems.push(`ikon "${prefix}:${name}" tidak ada di @iconify/json (dipakai di ${relative})`);
            continue;
        }

        used.get(prefix).add(name);
    }

    // b. prop icon="..." dengan prefix yang belum terdaftar di PREFIXES
    for (const match of code.matchAll(iconPropPattern)) {
        const prefix = match[1];
        if (!collections.has(prefix)) {
            problems.push(
                `prop icon memakai prefix "${prefix}" yang belum terdaftar (${relative}) — ` +
                    `tambahkan "${prefix}" ke array "prefixes" di scripts/generate-icons.mjs`,
            );
        }
    }
}

if (problems.length > 0) {
    fail(`${problems.length} masalah ditemukan:\n   - ${[...new Set(problems)].join('\n   - ')}`);
}

// ---------------------------------------------------------------------------
// 3. Kumpulkan ikon beserta rantai alias-nya (alias menunjuk induk wajib ikut)
// ---------------------------------------------------------------------------
const collected = new Map();

const collectIcon = (prefix, name, stack = []) => {
    if (stack.includes(name)) {
        fail(`rantai alias berputar pada "${prefix}:${name}" (${stack.join(' -> ')})`);
    }

    const output = collected.get(prefix);
    if (output.icons[name] || output.aliases[name]) return;

    const { icons, aliases } = collections.get(prefix);

    if (icons[name]) {
        output.icons[name] = icons[name];
        return;
    }

    const alias = aliases[name];
    output.aliases[name] = alias;

    if (alias.parent) {
        collectIcon(prefix, alias.parent, [...stack, name]);
    }
};

for (const prefix of prefixes) {
    collected.set(prefix, { icons: {}, aliases: {} });
    for (const name of used.get(prefix)) {
        collectIcon(prefix, name);
    }
}

// ---------------------------------------------------------------------------
// 4. Tulis file TypeScript
// ---------------------------------------------------------------------------
const totalIcons = [...collected.values()].reduce((sum, c) => sum + Object.keys(c.icons).length, 0);
const totalAliases = [...collected.values()].reduce((sum, c) => sum + Object.keys(c.aliases).length, 0);

const collectionsLiteral = prefixes
    .map((prefix) => {
        const { icons, aliases } = collected.get(prefix);
        const aliasesBlock = Object.keys(aliases).length ? `,\n        aliases: ${JSON.stringify(aliases)}` : '';
        return `    {
        prefix: '${prefix}',
        icons: ${JSON.stringify(icons)}${aliasesBlock},
    }`;
    })
    .join(',\n');

const output = `// AUTO-GENERATED oleh scripts/generate-icons.mjs — JANGAN EDIT MANUAL.
// Jalankan "npm run generate-icons" (atau "npm run build") untuk memperbarui.
// ${totalIcons} ikon + ${totalAliases} alias dibundel offline agar lolos CSP connect-src 'self'.
import type { IconifyJSON } from '@iconify/react';

export const offlineCollections: IconifyJSON[] = [
${collectionsLiteral},
];
`;

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, output);

console.log(
    `[generate-icons] OK: ${totalIcons} ikon + ${totalAliases} alias dari prefix ${prefixes.join(', ')} -> ${path.relative(root, outFile)}`,
);
