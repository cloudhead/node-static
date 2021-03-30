# CHANGES for `@brettz9/node-static`

## 0.1.1

### User-facing

- Update/fix: Protect additional `fs.stat` call (for `defaultExtension`)

## 0.1.0

Fork from `node-static`

### User-facing

- **Breaking change** (npm): Set `engines` to 10.11.0+
- Security: Fix dependency vulnerabilities by switching from `optimist` to
    `neodoc` (@fidian)
- Security: Update `mime` and `colors` (@fidian)
- Security: Support `bytes=0-0` Range header; fixes
    Unauthorized File Access issue <https://www.npmjs.com/advisories/1208>
    (@prajwalkman).
- Fix: Avoid octal (@bgao / @Ilrilan)
- Fix: For `spa`, allow dots after path (@gjuchault)
- Security Update/fix: Use `URL` constructor over deprecated `url.parse`;
    should fix Open Redirect issue <https://www.npmjs.com/advisories/1207>
- Update/fix: Protect `fs.stat` calls from bad path arguments (@brpvieira)
- Enhancement: Allow access with local ip (@flyingsky)
- Enhancement: Allow `serverInfo` to be `null` (@martindale)
- Enhancement: Time display logging with leading 0 (@mauris)
- Enhancement: Respect static `--cache 0` (@matthew-andrews)
- Enhancement: New option: `defaultExtension` (@fmalk)
- Enhancement: Added glob matching for setting cache headers (@lightswitch05)
- Optimization: 'use strict' directive
- Docs: Fix header example (@emmanouil)
- Docs: Sp. (@EdwardBetts)
- Docs: Add `CHANGES.md`

### Dev-facing

- Linting: Prefer const, no-var, fix indent, comment-out unused,
    prefer `startsWith` and `includes`
- Refactoring: Use safer non-prototype version of `colors`
- Maintenance: Add `.editorconfig`
- Testing: Add checks for supposed direct `node-static` vulnerabilities
- Testing: Add test for `null` and non-`null` serverInfo
- Testing: Allow tests at end (@fmalk)
- npm: Add eslint devDep. and script
- npm: Add lock file
