# noflo-liquid — Liquid templating for NoFlo

Liquid template engine components for [NoFlo](https://noflojs.org), with Jekyll-compatible filters and runtime-registered includes.

Part of the NoFlo 2.x component library family. Requires Node.js >= 22, and runs on Deno and Bun as well. Powered by [liquidjs](https://npmjs.com/package/liquidjs).

## Usage

    npm install @noflo/liquid

Component identifiers in graphs are `liquid/<Component>`, for example `liquid/Template`. See `noflo.json` for the machine-readable component manifest.

## Components

- **liquid/Template** — processes a Liquid `template` with `variables`, providing the Jekyll-compatible filters (`date_to_string`, `date_to_long_string`, `date_to_rfc822`, `date_to_xmlschema`, `number_of_words`, `strip_html`, `xml_escape`). Partial bodies registered on the `includes` port (objects with `path` and `body`) become available to `{% include %}` tags; includes must arrive before the template. Include registration state is per-component instance and cleared on teardown

## Development

    npm test

## License

MIT
