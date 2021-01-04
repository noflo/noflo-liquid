/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Liquid = require('liquid-node');

exports.registerInclude = function(engine, getter) {
  class Include extends Liquid.Tag {
    constructor(tagName, markup, tokens) {
      super(...arguments);
      this.includeName = tokens.trim();
      this.parsed = {};
    }

    getPartial(name) {
      if (this.parsed[name]) { return this.parsed[name]; }
      const template = getter(name);
      if (!template) { return; }
      return this.parsed[name] = engine.parse(template);
    }

    render(context) {
      const partial = this.getPartial(this.includeName);
      return partial.then(p => p.render(context));
    }
  }

  return engine.registerTag('include', Include);
};
