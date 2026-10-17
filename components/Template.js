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
    // Firing pattern, has-level only — no get before every gate passes,
    // so a decline can never leak an activated context: the render waits
    // for the include corpus to complete (the bracketed listing stream
    // closed, or the corpus leg's error marker arrived — a site without
    // an _includes directory), and for the template and variables
    if (input.attached("includes").length > 0) {
      const corpusReady =
        input.hasStream("includes") ||
        input.has(
          "includes",
          (/** @type {{ data: unknown }} */ ip) => ip.data instanceof Error,
        );
      if (!corpusReady) {
        return;
      }
    }
    if (!input.hasData("template", "variables")) {
      return;
    }
    // The reads: the activation opens here — every path past the gates
    // completes. The registration is non-consuming (a control port), so
    // the corpus stays buffered and re-registers idempotently; the error
    // marker carries no template
    if (input.hasData("includes")) {
      const stream = /** @type {import("@noflo/noflo").IP[] | undefined} */ (
        input.getStream("includes")
      );
      if (stream) {
        for (const ip of stream) {
          if (
            ip.type !== "data" ||
            !ip.data?.path ||
            ip.data instanceof Error
          ) {
            continue;
          }
          includes[path.basename(ip.data.path)] = ip.data.body;
        }
      }
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
