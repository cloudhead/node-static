# CHANGES for `@brettz9/node-static`

## 0.1.0

Fork from `node-static`

### User-facing

- Fix: Avoid octal (@bgao / @Ilrilan)
- Fix: Support `bytes=0-0` Range header (@prajwalkman)
- Fix: For `spa`, allow dots after path (@gjuchault)
- Update/fix: Protect `fs.stat` calls from bad path arguments (@brpvieira)
- Enhancement: Allow `serverInfo` to be `null` (@martindale)
- Enhancement: Time display logging with leading 0 (@mauris)
- Optimization: 'use strict' directive
- Docs: Fix header example (@emmanouil)
- Docs: Sp. (@EdwardBetts)
<<<<<<< HEAD
- npm: Update `mime` (updating to latest minor update only)
=======
- npm: Update `mime` and `colors` (@fidian)
>>>>>>> 69d9f54 (- Refactoring: Use safer non-prototype version of `colors` (had indeed been in use))
- npm: Set engines to 10.11.0+

### Dev-facing

- Linting: Prefer const, no-var, fix indent, comment-out unused,
    prefer `startsWith` and `includes`
- Refactoring: Use safer non-prototype version of `colors`
- Maintenance: Add `.editorconfig`
- Testing: Add test for `null` and non-`null` serverInfo
- npm: Add eslint devDep. and script
- npm: Add lock file
