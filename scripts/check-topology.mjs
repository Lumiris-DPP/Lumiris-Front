#!/usr/bin/env bun
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dir ?? new URL('.', import.meta.url).pathname, '..');
const APPS_DIR = join(ROOT, 'apps');

function readJson(path) {
    return JSON.parse(readFileSync(path, 'utf8'));
}

function listApps() {
    return readdirSync(APPS_DIR).filter((entry) => {
        const p = join(APPS_DIR, entry);
        return statSync(p).isDirectory();
    });
}

function appPackageNames() {
    const names = new Set();
    for (const dir of listApps()) {
        const pkgPath = join(APPS_DIR, dir, 'package.json');
        try {
            const pkg = readJson(pkgPath);
            if (pkg?.name) names.add(pkg.name);
        } catch {
            // package.json missing or malformed — skip this app
        }
    }
    return names;
}

function depsOf(pkg) {
    const all = {
        ...(pkg.dependencies ?? {}),
        ...(pkg.devDependencies ?? {}),
        ...(pkg.peerDependencies ?? {}),
        ...(pkg.optionalDependencies ?? {}),
    };
    return Object.keys(all);
}

function main() {
    const appNames = appPackageNames();
    const issues = [];

    for (const dir of listApps()) {
        const pkgPath = join(APPS_DIR, dir, 'package.json');
        let pkg;
        try {
            pkg = readJson(pkgPath);
        } catch {
            issues.push(`apps/${dir}: missing or invalid package.json`);
            continue;
        }
        const forbidden = depsOf(pkg).filter((d) => appNames.has(d) && d !== pkg.name);
        if (forbidden.length > 0) {
            issues.push(`${pkg.name} depends on ${forbidden.join(', ')} — apps must not depend on other apps`);
        }
    }

    if (issues.length > 0) {
        console.error('[topo] cross-app dependency detected:');
        for (const i of issues) console.error(`  - ${  i}`);
        process.exit(1);
    }

    console.log(`[topo] OK · ${appNames.size} apps audited, no cross-app deps`);
}

main();
