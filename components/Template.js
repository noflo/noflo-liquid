const noflo = require('noflo');
const liquid = require('liquid-node');
const path = require('path');

// Our local additional tags
const includeTag = require('../tags/include');

// We include Jekyll-style filters by default
const jekFilters = require('../filter/jekyll');

exports.getComponent = function () {
  const c = new noflo.Component();
  c.description = 'Process data with the Liquid template engine';
  c.icon = 'html5';

  c.inPorts.add('includes',
    { datatype: 'object' });
  c.inPorts.add('template',
    { datatype: 'string' });
  c.inPorts.add('variables',
    { datatype: 'object' });

  c.outPorts.add('out',
    { datatype: 'string' });
  c.outPorts.add('error',
    { datatype: 'object' });

  c.includes = {};

  c.forwardBrackets = { variables: ['out', 'error'] };

  return c.process((input, output) => {
    if (input.hasData('includes')) {
      const include = input.getData('includes');
      c.includes[path.basename(include.path)] = include.body;
      output.done();
      return;
    }

    if (!input.hasData('template', 'variables')) { return; }
    const [template, variables] = Array.from(input.getData('template', 'variables'));

    const engine = new liquid.Engine();
    engine.registerFilters(jekFilters);
    includeTag.registerInclude(engine, (name) => c.includes[name]);
    engine.parse(template)
      .then((tmpl) => tmpl.render(variables))
      .then((rendered) => output.sendDone({
        out: rendered,
      }), output.sendDone.bind(output));
  });
};
