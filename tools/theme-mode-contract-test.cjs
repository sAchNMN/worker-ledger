const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('app/src/main/assets/index.html', 'utf8');
const css = fs.readFileSync('app/src/main/assets/styles.css', 'utf8');
const themes = fs.readFileSync('app/src/main/res/values/themes.xml', 'utf8');
const nightColors = fs.readFileSync('app/src/main/res/values-night/colors.xml', 'utf8');
const nightThemes = fs.readFileSync('app/src/main/res/values-night/themes.xml', 'utf8');
const nightV27Themes = fs.readFileSync('app/src/main/res/values-night-v27/themes.xml', 'utf8');
const v31Themes = fs.readFileSync('app/src/main/res/values-v31/themes.xml', 'utf8');
const nightV31Themes = fs.readFileSync('app/src/main/res/values-night-v31/themes.xml', 'utf8');
const activity = fs.readFileSync('app/src/main/java/com/workerledger/app/MainActivity.java', 'utf8');
const lightIcon = fs.readFileSync('app/src/main/res/drawable/ic_launcher_foreground.xml', 'utf8');
const darkIcon = fs.readFileSync('app/src/main/res/drawable-night/ic_launcher_foreground.xml', 'utf8');

assert.doesNotMatch(html, /id=["']theme-button["']/,
  'the page must not render a manual theme toggle button');
assert.match(html, /<meta\s+name=["']color-scheme["']\s+content=["']dark light["']\s*\/?\s*>/,
  'the WebView page must declare its supported color schemes');
assert.match(css, /@media\s*\(prefers-color-scheme:\s*dark\)/,
  'the web UI must follow the system color scheme');
assert.doesNotMatch(css, /body\[data-theme=["']dark["']\]/,
  'dark mode must not depend on a manual theme attribute');
assert.match(themes, /parent=["']android:style\/Theme\.Material\.Light\.NoActionBar["']/,
  'the Android container must keep a compatible light base theme');
assert.match(themes, /name=["']android:windowBackground["']>\s*@color\/cream_background/,
  'the light window background must use the app surface color');
assert.match(nightColors, /name=["']cream_background["']>\s*#192622/,
  'night resources must provide a dark window background');
assert.match(nightThemes, /name=["']android:windowBackground["']>\s*@color\/cream_background/,
  'the dark window background must use the app surface color');
assert.match(nightThemes, /name=["']android:windowLightStatusBar["']>\s*false/,
  'night resources must use light status bar content');
assert.match(nightThemes, /name=["']android:isLightTheme["']>\s*false/,
  'night resources must tell WebView to use the dark scheme');
assert.match(nightV27Themes, /name=["']android:windowLightNavigationBar["']>\s*false/,
  'night resources must use light navigation bar content');
assert.match(v31Themes, /name=["']android:windowSplashScreenBackground["']>\s*@color\/cream_background/,
  'the light Android 12 splash must use the app surface color');
assert.match(v31Themes, /name=["']android:windowSplashScreenAnimatedIcon["']>\s*@drawable\/ic_launcher_foreground/,
  'the light Android 12 splash must use the app icon');
assert.match(nightV31Themes, /name=["']android:windowSplashScreenBackground["']>\s*@color\/cream_background/,
  'the dark Android 12 splash must use the app surface color');
assert.match(nightV31Themes, /name=["']android:windowSplashScreenAnimatedIcon["']>\s*@drawable\/ic_launcher_foreground/,
  'the dark Android 12 splash must use the app icon');
assert.match(lightIcon, /android:fillColor=["']#FFF8EE["']/,
  'the light launcher icon must keep its light palette');
assert.match(darkIcon, /android:fillColor=["']#EAF4ED["']/,
  'the dark launcher icon must use a high-contrast palette');
assert.doesNotMatch(darkIcon, /android:fillColor=["']#FFF8EE["']/,
  'the dark launcher icon must not depend on the light palette');
assert.match(activity, /setBackgroundColor\(getColor\(R\.color\.cream_background\)\)/,
  'the WebView background must follow night resources');

console.log('theme mode contract passed');
