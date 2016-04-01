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
    control: true
  c.inPorts.add 'template',
    datatype: 'string'
  c.inPorts.add 'variables',
    datatype: 'object'

  c.outPorts.add 'out',
    datatype: 'string'
  c.outPorts.add 'error',
    datatype: 'object'

  c.process (input, output) ->
    return unless input.has 'template', 'variables'
    [template, variables] = input.get 'template', 'variables'
    return unless variables.type is 'data'
    return unless template.type is 'data'

    # FIXME: We may want to collect these instead of just having one
    includes = {}
    if input.has 'includes'
      include = input.getData 'includes'
      includes[path.basename(include.path)] = include.body

    engine = new liquid.Engine
    includeTag.registerInclude engine, (name) -> includes[name]
    engine.registerFilters jekFilters
    engine.parse template.data
    .then (tmpl) ->
      tmpl.render variables.data
    .then (rendered) ->
      output.sendDone
        out: rendered
    , output.sendDone.bind output
