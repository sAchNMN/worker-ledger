import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => readFile(path.join(root, relativePath), 'utf8');

const styles = await read('app/src/main/assets/styles.css');
const index = await read('app/src/main/assets/index.html');
const app = await read('app/src/main/assets/app.js');
const dayColors = await read('app/src/main/res/values/colors.xml');
const nightColors = await read('app/src/main/res/values-night/colors.xml');

const lightTokens = {
    bg: '#F6F7F3', surface: '#FFFEFA', raised: '#FFFFFF', inset: '#EEF1EB', line: '#DDE3DC',
    control: '#758378', text: '#27352E', secondary: '#526259', muted: '#5B695F', primary: '#28664F',
    'primary-hover': '#205640', 'primary-pressed': '#194633', 'on-primary': '#FFFFFF', 'primary-soft': '#E4EFE7',
    expense: '#96533F', 'expense-soft': '#F5EAE3', warning: '#826322', 'warning-soft': '#F6EEDB',
    danger: '#B13F49', 'danger-hover': '#99323C', 'danger-pressed': '#812A34', 'on-danger': '#FFFFFF',
    'danger-soft': '#FBEAEC', info: '#446A85', 'info-soft': '#E8EFF4', 'disabled-bg': '#E6EAE3',
    'disabled-text': '#758075', overlay: 'rgba(24, 29, 27, .38)', shadow: '0 6px 20px rgba(39, 53, 46, .05)'
};
const darkTokens = {
    bg: '#181D1B', surface: '#222925', raised: '#2C3530', inset: '#1C221F', line: '#3D4941',
    control: '#7B8A80', text: '#E5EBE5', secondary: '#BCC8BD', muted: '#A1AFA4', primary: '#8BC5A4',
    'primary-hover': '#A0D2B6', 'primary-pressed': '#77B391', 'on-primary': '#17271E', 'primary-soft': '#2A3B30',
    expense: '#D7A089', 'expense-soft': '#382C27', warning: '#D1B475', 'warning-soft': '#373225',
    danger: '#F09BA4', 'danger-hover': '#F5ADB4', 'danger-pressed': '#DC8892', 'on-danger': '#32161C',
    'danger-soft': '#422B30', info: '#A2BFD2', 'info-soft': '#293641', 'disabled-bg': '#303A33',
    'disabled-text': '#87958A', overlay: 'rgba(0, 0, 0, .58)', shadow: 'none'
};

function assertTokens(css, tokens, selector) {
    const block = css.match(new RegExp(`${selector}\\s*\\{([\\s\\S]*?)\\}`))?.[1] ?? '';
    for (const [name, value] of Object.entries(tokens)) {
        assert.match(block, new RegExp(`--${name.replace('-', '\\-')}\\s*:\\s*${value.replace(/[().,]/g, '\\$&')}`), `${selector} is missing --${name}: ${value}`);
    }
}

assertTokens(styles, lightTokens, ':root');
assertTokens(styles, darkTokens, '@media \\(prefers-color-scheme: dark\\) \\{\\s*:root');
assert.doesNotMatch(styles, /--(?:cream|paper|mint(?:-deep|-soft)?|coral(?:-soft)?|sun(?:-soft)?|ink)\s*:/);
assert.doesNotMatch(styles, /(?:radial|linear)-gradient\s*\(/);
assert.equal((styles.match(/rgba\s*\(/g) || []).length, 3, 'rgba() should only appear in the light overlay/shadow and dark overlay tokens');
assert.match(index, /theme-color" media="\(prefers-color-scheme: light\)" content="#F6F7F3"/i);
assert.match(index, /theme-color" media="\(prefers-color-scheme: dark\)" content="#181D1B"/i);
assert.doesNotMatch(index, /#(?:fff8ee|fffdf9|bdebdc|ffad95|e98777|f88f7d|a55c58|db756b|7dcbb0|63ad96|f6c95e|e4ab42)\b/i);
assert.match(app, /monthly-balance.*classList\.toggle\('negative'/s);
assert.match(app, /-delta.*classList\.toggle\('positive'/s);
assert.match(app, /-delta.*classList\.toggle\('negative'/s);
assert.match(styles, /\.summary-card\.balance strong\.negative\s*\{[^}]*color:\s*var\(--warning\)/);
assert.match(dayColors, /mint_primary.*#28664F/i);
assert.match(dayColors, /cream_background.*#F6F7F3/i);
assert.match(nightColors, /mint_primary.*#8BC5A4/i);
assert.match(nightColors, /cream_background.*#181D1B/i);

for (const themePath of [
    'app/src/main/res/values/themes.xml',
    'app/src/main/res/values-v31/themes.xml',
    'app/src/main/res/values-night/themes.xml',
    'app/src/main/res/values-night-v27/themes.xml',
    'app/src/main/res/values-night-v31/themes.xml'
]) {
    const theme = await read(themePath);
    assert.match(theme, /windowBackground.*@color\/cream_background/);
    assert.match(theme, /statusBarColor.*@color\/cream_background/);
    assert.match(theme, /navigationBarColor.*@color\/cream_background/);
}

console.log('Color system contract passed.');
