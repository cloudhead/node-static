# CHANGES for `node-static`

## 0.8.0 (UNRELEASED)

### User-facing

- **Breaking change** (npm): Set `engines` to 20.11.0+
- **Breaking change**: Add `type: 'module'` and `exports` to `package.json`;
    change internal CJS path
- **Breaking change**: avoid serving hidden files by default (reenable with `--serve-hidden`/`serveHidden`)
- Security: Fix dependency vulnerabilities by switching from `optimist` to
    `command-line-basics` (@brettz9)
- Security: Update `mime` and `colors` (@fidian) and pin `colors`
    (@mannyluvstacos)
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
- Fix: ensure query string on directory request is passed on
- Fix: Ensure package `version` stays up to date
- Fix: path should be more generous in unescaping anything valid in a
    path (such as a hash)
- Fix: Avoid logging range errors to console
- Fix: ensure `--default-extension` and `--server-info` are settable by CLI
- Fix: change `fs.createReadStream()` mode to integer (@pixcai)
- Enhancement: TypeScript support
- Enhancement: Allow access with local ip (@flyingsky)
- Enhancement: Allow `serverInfo` to be `null` (@martindale)
- Enhancement: Time display logging with leading 0 (@mauris)
- Enhancement: Respect static `--cache 0` (@matthew-andrews)
- Enhancement: New option: `defaultExtension` (@fmalk)
- Enhancement: Added glob matching for setting cache headers (@lightswitch05)
- Update: Switch from deprecated `request` to `node-fetch`
- Optimization: 'use strict' directive
- Refactoring: Switch to ESM
- Docs: For examples (and internally) avoid `static` reserved word
- Docs: Fix header example (@emmanouil)
- Docs: Sp. (@EdwardBetts)
- Docs: Make install section more visible, make defaults visible in
    semantically marked-up headings and add CLI options
- Docs: Add `CHANGES.md`
- Docs: Add ESM file-server example

### Dev-facing

- Linting: Prefer const, no-var, fix indent, comment-out unused,
    prefer `startsWith` and `includes`
- Refactoring: Use safer non-prototype version of `colors`
- Maintenance: Add `.editorconfig`
- Testing: Full test coverage
- Testing: Add checks for supposed direct `node-static` vulnerabilities
- Testing: Allow tests to end (@fmalk)
- Testing: Switch to `mocha`/`chai`/`c8`
- Testing: Add CI workflow
- Testing: Begin binary file coverage
- npm: Add eslint devDep. and script
- npm: Add lock file
