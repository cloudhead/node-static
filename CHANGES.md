# CHANGES for `@brettz9/node-static`

## 0.1.0

Fork from `node-static`

### User-facing

- Security: Fix dependency vulnerabilities by switching from `optimist` to
    `neodoc` (@fidian)
- Fix: Avoid octal (@bgao / @Ilrilan)
- Fix: Support `bytes=0-0` Range header (@prajwalkman)
- Fix: For `spa`, allow dots after path (@gjuchault)
- Update/fix: Protect `fs.stat` calls from bad path arguments (@brpvieira)
- Enhancement: Allow access with local ip (@flyingsky)
- Enhancement: Allow `serverInfo` to be `null` (@martindale)
- Enhancement: Time display logging with leading 0 (@mauris)
- Enhancement: Respect static `--cache 0` (@matthew-andrews)
- Enhancement: New option: `defaultExtension` (@fmalk)
- Optimization: 'use strict' directive
- Docs: Fix header example (@emmanouil)
- Docs: Sp. (@EdwardBetts)
- npm: Update `mime` and `colors` (@fidian)
- npm: Set `engines` to 10.11.0+

### Dev-facing

- Linting: Prefer const, no-var, fix indent, comment-out unused,
    prefer `startsWith` and `includes`
- Refactoring: Use safer non-prototype version of `colors`
- Maintenance: Add `.editorconfig`
- Testing: Add checks for supposed direct node-static vulnerabilities
- Testing: Add test for `null` and non-`null` serverInfo
- Testing: Allow tests at end (@fmalk)
- npm: Add eslint devDep. and script
- npm: Add lock file
