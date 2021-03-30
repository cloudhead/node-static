# CHANGES for `@brettz9/node-static`

## 0.1.1

### User-facing

- Update/fix: Protect additional `fs.stat` call (for `defaultExtension`)

## 0.1.0

Fork from `node-static`

### User-facing

<<<<<<< HEAD
=======
- Security: Fix dependency vulnerabilities by switching from `optimist` to
    `neodoc` (@fidian)
>>>>>>> 3d70b2e (- Docs: Add missing credit to CHANGES)
- Fix: Avoid octal (@bgao / @Ilrilan)
- Fix: Support `bytes=0-0` Range header (@prajwalkman)
- Fix: For `spa`, allow dots after path (@gjuchault)
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
- npm: Update `mime` (updating to latest minor update only)
=======
- npm: Update `mime` and `colors` (@fidian)
<<<<<<< HEAD
>>>>>>> 69d9f54 (- Refactoring: Use safer non-prototype version of `colors` (had indeed been in use))
- npm: Set engines to 10.11.0+
=======
- npm: Set `engines` to 10.11.0+
>>>>>>> 8e3059e (- Docs: Code)

### Dev-facing

- Linting: Prefer const, no-var, fix indent, comment-out unused,
    prefer `startsWith` and `includes`
- Refactoring: Use safer non-prototype version of `colors`
- Maintenance: Add `.editorconfig`
- Testing: Add checks for supposed direct `node-static` vulnerabilities
- Testing: Add test for `null` and non-`null` serverInfo
- npm: Add eslint devDep. and script
- npm: Add lock file
