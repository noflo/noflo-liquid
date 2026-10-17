# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0-alpha.4] - 2026-10-17

## [2.0.0-alpha.3] - 2026-10-17

## [2.0.0-alpha.2] - 2026-10-16

### Changed

- The `includes` inport of `liquid/Template` is now a control port: include registration is standing engine configuration, not per-message data. Registrations arrive as one bracketed stream on the port and are read non-consumingly — re-registration on every activation is idempotent. Under assembly wrapping (`asAssembly`/`wrapAssembly`) this keeps `includes` out of the per-message field mapping, where a missing field previously delivered `null` and crashed the component's path handling. The old consume-one-include-per-activation behavior is gone: send all registrations as one bracketed stream
- Package renamed to `@noflo/liquid`; the version resets to the 2.x generation (2.0.0-alpha.1) for the fresh package name. Component addressing is unchanged — library IDs derive identically from the scoped name, so component and graph names stay the same. The old `noflo-liquid` will be deprecated with a pointer once 2.x reaches stable
- Migrated to NoFlo 2.x: components now depend on `@noflo/noflo` ^2.0.0 instead of the unscoped `noflo` 1.x package; components export a named `getComponent`
- Package is now plain ESM with no build step; supported runtime is Node.js >= 22 (components also run under Deno and Bun); indentation normalized to spaces per the repository EditorConfig
- Replaced the dead `liquid-node` engine with `liquidjs` (maintained, isomorphic). The Jekyll-compatible filter set (`date_to_string`, `date_to_long_string`, `date_to_rfc822`, `date_to_xmlschema`, `number_of_words`, `strip_html`, `xml_escape`) ports verbatim, and the `{% include %}` tag now renders partials with the template's variables
- The component no longer requires the `noflo-nodejs` runtime: liquidjs is isomorphic, so `liquid/Template` runs in browsers too (the 1.x component was node-only)
- Include registration state is cleared on component teardown
- Template failures are reported on the `error` port with `output.error()` instead of calling `sendDone` with an error

### Added

- `test/` node:test suite covering variable substitution, every Jekyll filter, runtime includes, nested rendering, and the error path
- Publish-time `noflo.json` component manifest
