import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as noflo from "@noflo/noflo";

import { getComponent as getTemplate } from "../components/Template.js";

/**
 * Waits for the next data IP on a socket.
 * @param {import("@noflo/noflo").internalSocket.InternalSocket} socket
 * @returns {Promise<import("@noflo/noflo").IP>}
 */
const nextData = (socket) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Timed out waiting for IP"));
    }, 4000);
    /** @param {CustomEvent} event */
    const listener = (event) => {
      if (event.detail.type === "data") {
        cleanup();
        resolve(event.detail);
      }
    };
    const cleanup = () => {
      clearTimeout(timer);
      socket.removeEventListener("ip", listener);
    };
    socket.addEventListener("ip", listener);
  });

/**
 * Sends includes as one bracketed control stream, then the template and
 * variables, returning the rendered output.
 * @param {import("@noflo/noflo").Component} c
 * @param {string} template
 * @param {Record<string, unknown>} variables
 * @param {Array<{ path: string, body: string }>} [includes]
 * @returns {Promise<string>}
 */
const render = async (c, template, variables, includes = []) => {
  const outSocket = noflo.internalSocket.createSocket();
  c.outPorts.out.attach(outSocket);
  const received = nextData(outSocket);
  const templateSocket = noflo.internalSocket.createSocket();
  const variablesSocket = noflo.internalSocket.createSocket();
  c.inPorts.template.attach(templateSocket);
  c.inPorts.variables.attach(variablesSocket);
  // Control ports buffer the latest stream: multiple registrations must
  // arrive as one bracketed stream or each discards the previous
  if (includes.length > 0) {
    const includesSocket = noflo.internalSocket.createSocket();
    c.inPorts.includes.attach(includesSocket);
    includesSocket.post(new noflo.IP("openBracket", null));
    for (const include of includes) {
      includesSocket.post(new noflo.IP("data", include));
    }
    includesSocket.post(new noflo.IP("closeBracket", null));
  }
  variablesSocket.post(new noflo.IP("data", variables));
  templateSocket.post(new noflo.IP("data", template));
  const ip = await received;
  return ip.data;
};

describe("Template component", () => {
  it("replaces variables in a simple template", async () => {
    const c = getTemplate();
    try {
      const out = await render(c, "Hi {{ name }}!", { name: "Jekyll" });
      assert.equal(out, "Hi Jekyll!");
    } finally {
      await c.shutdown();
    }
  });
  it("supports the jekyll strip_html filter", async () => {
    const c = getTemplate();
    try {
      const out = await render(c, "{{ content | strip_html }}", {
        content: "<p>Hello <strong>world</strong></p>",
      });
      assert.equal(out, "Hello world");
    } finally {
      await c.shutdown();
    }
  });
  it("supports the jekyll date_to_string filter", async () => {
    const c = getTemplate();
    try {
      const out = await render(c, "{{ date | date_to_string }}", {
        date: new Date(Date.UTC(2014, 2, 15)),
      });
      assert.equal(out, "15 Mar 2014");
    } finally {
      await c.shutdown();
    }
  });
  it("supports the jekyll date_to_xmlschema filter", async () => {
    const c = getTemplate();
    try {
      const out = await render(c, "{{ date | date_to_xmlschema }}", {
        date: new Date(Date.UTC(2014, 2, 15)),
      });
      assert.equal(out, "2014-03-15T00:00:00.000Z");
    } finally {
      await c.shutdown();
    }
  });
  it("supports the jekyll number_of_words filter", async () => {
    const c = getTemplate();
    try {
      const out = await render(c, "{{ text | number_of_words }}", {
        // The 1.x filter collapses a newline plus space into a newline,
        // joining the last two words into one token
        text: "one two  three\n four",
      });
      assert.equal(out, "3");
    } finally {
      await c.shutdown();
    }
  });
  it("processes runtime-registered includes", async () => {
    const c = getTemplate();
    try {
      const out = await render(
        c,
        "Header {% include footer.html %}",
        { year: 2014 },
        [{ path: "site/footer.html", body: "Footer {{ year }}" }],
      );
      assert.equal(out, "Header Footer 2014");
    } finally {
      await c.shutdown();
    }
  });
  it("renders a complex template with filters and includes", async () => {
    const c = getTemplate();
    try {
      const out = await render(
        c,
        "{% for post in posts %}<h2>{{ post.title | strip_html }}</h2>{% endfor %}{% include bottom.html %}",
        { posts: [{ title: "One <b>bold</b>" }, { title: "Two" }] },
        [{ path: "bottom.html", body: "THE END" }],
      );
      assert.equal(out, "<h2>One bold</h2><h2>Two</h2>THE END");
    } finally {
      await c.shutdown();
    }
  });
  it("reports template errors on the error port", async () => {
    const c = getTemplate();
    const errorSocket = noflo.internalSocket.createSocket();
    c.outPorts.error.attach(errorSocket);
    try {
      const errored = nextData(errorSocket);
      const templateSocket = noflo.internalSocket.createSocket();
      const variablesSocket = noflo.internalSocket.createSocket();
      c.inPorts.template.attach(templateSocket);
      c.inPorts.variables.attach(variablesSocket);
      variablesSocket.post(new noflo.IP("data", {}));
      templateSocket.post(new noflo.IP("data", "{% unknownfilter %}"));
      const ip = await errored;
      assert.ok(ip.data instanceof Error);
    } finally {
      await c.shutdown();
    }
  });
});
