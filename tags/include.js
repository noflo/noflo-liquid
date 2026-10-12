/**
 * Registers a Jekyll-style `{% include %}` tag on a liquidjs engine. The
 * tag renders partial bodies from the given lookup map, which the
 * component fills from its `includes` port.
 *
 * @param {import("liquidjs").Liquid} engine
 * @param {Record<string, string>} includes Map of include name to partial body
 * @returns {void}
 */
export function registerIncludeTag(engine, includes) {
  engine.registerTag("include", {
    parse(/** @type {{ args: string }} */ tagToken) {
      this.includeName = tagToken.args.trim().replace(/^['"]|['"]$/g, "");
    },
    /**
     * @param {{ environments: Record<string, unknown> }} scope
     * @param {{ write(text: string): void }} emitter
     * @returns {Promise<void>}
     */
    async render(scope, emitter) {
      const name = /** @type {{ includeName: string }} */ (
        /** @type {unknown} */ (this)
      ).includeName;
      const body = includes[name];
      if (!body) {
        return;
      }
      // Partials render with the template's variables, like the 1.x
      // context-based rendering
      emitter.write(await engine.parseAndRender(body, scope.environments));
    },
  });
}
