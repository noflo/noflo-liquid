noflo = require 'noflo'
liquid = require 'liquid-node'
path = require 'path'

# Our local additional tags
includeTag = require '../tags/include.coffee'

# We include Jekyll-style filters by default
jekFilters = require '../filter/jekyll.coffee'

exports.getComponent = ->
  c = new noflo.Component
  c.description = 'Process data with the Liquid template engine'
  c.icon = 'html5'

  c.inPorts.add 'includes',
    datatype: 'object'
  c.inPorts.add 'template',
    datatype: 'string'
  c.inPorts.add 'variables',
    datatype: 'object'

  c.outPorts.add 'out',
    datatype: 'string'
  c.outPorts.add 'error',
    datatype: 'object'

  c.includes = {}

  c.forwardBrackets =
    variables: ['out', 'error']

  c.process (input, output) ->
    if input.hasData 'includes'
      include = input.getData 'includes'
      c.includes[path.basename(include.path)] = include.body
      return output.done()

    return unless input.hasData 'template', 'variables'
    [template, variables] = input.getData 'template', 'variables'

    engine = new liquid.Engine
    engine.registerFilters jekFilters
    includeTag.registerInclude engine, (name) -> c.includes[name]
    engine.parse template
    .then (tmpl) ->
      tmpl.render variables
    .then (rendered) ->
      output.sendDone
        out: rendered
    , output.sendDone.bind output
