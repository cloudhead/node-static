# CHANGES for `@brettz9/node-static`

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
- **Breaking change** (npm): Set `engines` to 10.11.0+
>>>>>>> 4a4b46a (Docs: CHANGES clarifications)
- Security: Fix dependency vulnerabilities by switching from `optimist` to
    `neodoc` (@fidian)
<<<<<<< HEAD
>>>>>>> 3d70b2e (- Docs: Add missing credit to CHANGES)
=======
- Security: Update `mime` and `colors` (@fidian)
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
- Enhancement: Allow `serverInfo` to be `null` (@martindale)
- Enhancement: Time display logging with leading 0 (@mauris)
<<<<<<< HEAD
=======
- Enhancement: Respect static `--cache 0` (@matthew-andrews)
- Enhancement: New option: `defaultExtension` (@fmalk)
- Enhancement: Added glob matching for setting cache headers (@lightswitch05)
>>>>>>> 64d9d86 (Docs: Give credit in CHANGES)
- Optimization: 'use strict' directive
- Docs: Fix header example (@emmanouil)
- Docs: Sp. (@EdwardBetts)
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
- npm: Add eslint devDep. and script
- npm: Add lock file
