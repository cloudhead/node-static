# CHANGES for `node-static`

## ? (UNRELEASED)

### User-facing

<<<<<<< HEAD
<<<<<<< HEAD
- Docs (README): Detail some changes from fork
- Docs (CHANGES): Clarifications

### Dev-facing

- Testing: Add `nyc` for coverage

## 0.1.1

### User-facing

- Update/fix: Protect additional `fs.stat` call (for `defaultExtension`)

## 0.1.0

Fork from `node-static`

### User-facing

<<<<<<< HEAD
<<<<<<< HEAD
=======
=======
=======
>>>>>>> 3fcb831 (Revert scoping changes; line breaks; use of `const` in README)
- **Breaking change** (npm): Set `engines` to 10.11.0+
>>>>>>> 4a4b46a (Docs: CHANGES clarifications)
=======
- **Breaking change** (npm): Set `engines` to 12.0.0+
>>>>>>> ed8026e (chore: bump `engines` to maintained Node (12+))
- Security: Fix dependency vulnerabilities by switching from `optimist` to
    `neodoc` (@fidian)
<<<<<<< HEAD
>>>>>>> 3d70b2e (- Docs: Add missing credit to CHANGES)
=======
- Security: Update `mime` and `colors` (@fidian)
<<<<<<< HEAD
<<<<<<< HEAD
>>>>>>> b3516d1 (Docs (CHANGES): Denote security fix)
=======
- Security: Support `bytes=0-0` Range header; fixes
    Unauthorized File Access issue <https://www.npmjs.com/advisories/1208>
    (@prajwalkman).
>>>>>>> 8dc43b0 (Docs (CHANGES): Further security fix denotations)
- Fix: Avoid octal (@bgao / @Ilrilan)
- Fix: For `spa`, allow dots after path (@gjuchault)
- Security Update/fix: Use `URL` constructor over deprecated `url.parse`;
    should fix Open Redirect issue <https://www.npmjs.com/advisories/1207>
- Update/fix: Protect `fs.stat` calls from bad path arguments (@brpvieira)
=======
- Security Update/fix: Use `URL` constructor over deprecated `url.parse`;
    should fix Open Redirect issue <https://www.npmjs.com/advisories/1207>
- Security Update/fix: Protect `fs.stat` calls from bad path arguments; fixes
    Denial of Service issue <https://www.npmjs.com/advisories/1208>
    (@brpvieira)
- Security fix?: The Unauthorized File Access issue
    <https://www.npmjs.com/advisories/1206> does not appear to be an issue
    per testing (if it ever was); if you can provide a test case where it
    fails, please report
- Fix: Support `bytes=0-0` Range header (@prajwalkman)
- Fix: Avoid octal (@bgao / @Ilrilan)
- Fix: For `spa`, allow dots after path (@gjuchault)
- Fix: Ensure package `version` stays up to date
- Enhancement: Allow access with local ip (@flyingsky)
>>>>>>> 51fdfdb (Docs (CHANGES): Fix labeling of issue and indicate security fixes and potential fix)
- Enhancement: Allow `serverInfo` to be `null` (@martindale)
- Enhancement: Time display logging with leading 0 (@mauris)
<<<<<<< HEAD
=======
- Enhancement: Respect static `--cache 0` (@matthew-andrews)
- Enhancement: New option: `defaultExtension` (@fmalk)
- Enhancement: Added glob matching for setting cache headers (@lightswitch05)
>>>>>>> 64d9d86 (Docs: Give credit in CHANGES)
- Optimization: 'use strict' directive
- Docs: For examples (and internally) avoid `static` reserved word
- Docs: Fix header example (@emmanouil)
- Docs: Sp. (@EdwardBetts)
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
- npm: Update `mime` (updating to latest minor update only)
=======
- npm: Update `mime` and `colors` (@fidian)
<<<<<<< HEAD
>>>>>>> 69d9f54 (- Refactoring: Use safer non-prototype version of `colors` (had indeed been in use))
- npm: Set engines to 10.11.0+
=======
- npm: Set `engines` to 10.11.0+
>>>>>>> 8e3059e (- Docs: Code)
=======
=======
- Docs: Make install section more visible, make defaults visible in
    semantically marked-up headings and add CLI options
>>>>>>> 4b7e884 (chore: update devDep. (eslint))
- Docs: Add `CHANGES.md`
<<<<<<< HEAD
- npm: Update `mime` and `colors` (@fidian)
>>>>>>> 4a4b46a (Docs: CHANGES clarifications)
=======
>>>>>>> b3516d1 (Docs (CHANGES): Denote security fix)

### Dev-facing

- Linting: Prefer const, no-var, fix indent, comment-out unused,
    prefer `startsWith` and `includes`
- Refactoring: Use safer non-prototype version of `colors`
- Maintenance: Add `.editorconfig`
- Testing: Add checks for supposed direct `node-static` vulnerabilities
- Testing: Add test for `null` and non-`null` serverInfo
<<<<<<< HEAD
=======
- Testing: Allow tests to end (@fmalk)
<<<<<<< HEAD
>>>>>>> 6e5173a (Docs (CHANGES): Fix)
=======
- Testing: Add `nyc` for coverage
>>>>>>> 3fcb831 (Revert scoping changes; line breaks; use of `const` in README)
- npm: Add eslint devDep. and script
- npm: Add lock file
