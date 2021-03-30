# CHANGES for `@brettz9/node-static`

## ? (UNRELEASED)

### User-facing

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

- **Breaking change** (npm): Set `engines` to 10.11.0+
- Security: Fix dependency vulnerabilities by switching from `optimist` to
    `neodoc` (@fidian)
- Security: Update `mime` and `colors` (@fidian)
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
- Enhancement: Allow access with local ip (@flyingsky)
- Enhancement: Allow `serverInfo` to be `null` (@martindale)
- Enhancement: Time display logging with leading 0 (@mauris)
- Enhancement: Respect static `--cache 0` (@matthew-andrews)
- Enhancement: New option: `defaultExtension` (@fmalk)
- Enhancement: Added glob matching for setting cache headers (@lightswitch05)
- Optimization: 'use strict' directive
- Docs: For examples (and internally) avoid `static` reserved word
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
- Testing: Allow tests to end (@fmalk)
- npm: Add eslint devDep. and script
- npm: Add lock file
