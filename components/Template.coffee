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

  c.process (input, output) ->
    c.autoOrdering = false
    if input.has 'includes'
      include = input.get 'includes'
      return unless include.type is 'data'
      c.includes[path.basename(include.data.path)] = include.data.body
      return

    return unless input.has 'template', 'variables', (ip) -> ip.type is 'data'
    [template, variables] = input.get 'template', 'variables'
    return unless variables.type is 'data'
    return unless template.type is 'data'

    engine = new liquid.Engine
    includeTag.registerInclude engine, (name) -> c.includes[name]
    engine.registerFilters jekFilters
    engine.parse template.data
    .then (tmpl) ->
      tmpl.render variables.data
    .then (rendered) ->
      output.sendDone
        out: rendered
    , output.sendDone.bind output
