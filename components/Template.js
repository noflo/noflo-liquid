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
          "Include registration: an object with path and body. Includes must arrive before the template",
        required: false,
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
    if (input.hasData("includes")) {
      const include = input.getData("includes");
      includes[path.basename(include.path)] = include.body;
      output.done();
      return;
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
