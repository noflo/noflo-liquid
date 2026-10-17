import path from "node:path";
import { Component } from "@noflo/noflo";
import { Liquid } from "liquidjs";
import { jekyllFilters } from "../filter/jekyll.js";
import { registerIncludeTag } from "../tags/include.js";

/**
 * Processes a Liquid template with the given variables, providing the
 * Jekyll-compatible filters and runtime-registered includes.
 * @returns {import("@noflo/noflo").Component} The configured component
 */
export function getComponent() {
  /** @type {Record<string, string>} */
  const includes = {};
  const engine = new Liquid();
  for (const [name, filter] of Object.entries(jekyllFilters)) {
    engine.registerFilter(name, filter);
  }
  registerIncludeTag(engine, includes);

  const c = new Component({
    description: "Process data with the Liquid template engine",
    icon: "html5",
    inPorts: {
      includes: {
        datatype: "object",
        description:
          "Include registration: objects with path and body, sent as one bracketed stream; registrations accumulate and apply to renders made after they arrive",
        control: true,
        required: false,
        // The include corpus is shared site configuration delivered
        // unscoped; renders may run under message scopes
        scoped: false,
      },
      template: {
        datatype: "string",
        description: "Liquid template source",
        required: true,
      },
      variables: {
        datatype: "object",
        description: "Variables available to the template",
        required: true,
      },
    },
    outPorts: {
      out: {
        datatype: "string",
        description: "Rendered output",
      },
      error: {
        datatype: "object",
      },
    },
  });

  c.forwardBrackets = { variables: ["out", "error"] };

  c.tearDown = async () => {
    for (const key of Object.keys(includes)) {
      delete includes[key];
    }
  };

  c.process((input, output) => {
    // Control port: the latest buffered stream, read non-consumingly.
    // Re-registering on every activation is idempotent, and reading
    // must not early-return — a register-and-return branch would consume
    // every render activation now that the port never drains
    if (input.hasData("includes")) {
      // Non-addressable control port: the buffered stream scan returns
      // the plain IP array
      const stream = /** @type {import("@noflo/noflo").IP[] | undefined} */ (
        input.getStream("includes")
      );
      if (stream) {
        for (const ip of stream) {
          if (ip.type !== "data") {
            continue;
          }
          includes[path.basename(ip.data.path)] = ip.data.body;
        }
      }
    }
    if (!input.hasData("template", "variables")) {
      return;
    }
    const [template, variables] = input.getData("template", "variables");
    engine
      .parseAndRender(template, variables)
      .then((rendered) => {
        output.sendDone({ out: rendered });
      })
      .catch((error) => {
        output.error(error instanceof Error ? error : new Error(String(error)));
        output.done();
      });
  });

  return c;
}
