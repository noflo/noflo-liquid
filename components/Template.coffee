noflo = require 'noflo'
liquid = require 'liquid-node'
path = require 'path'

class Template extends noflo.Component
  constructor: ->
    @includes = {}
    @inPorts =
      layouts: new noflo.Port()
      includes: new noflo.Port()
      in: new noflo.Port()
    @outPorts =
      out: new noflo.Port()
      error: new noflo.Port()

    @inPorts.layouts.on 'data', (data) =>
      @addInclude data

    @inPorts.includes.on 'data', (data) =>
      @addInclude data

    @inPorts.in.on 'data', (data) =>
      @template data

    @inPorts.in.on 'disconnect', =>
      @outPorts.out.disconnect()

    do @prepareLiquid

  template: (data) ->
    tmpl = @parseTemplate data.layout
    promise = tmpl.render data
    promise.done (rendered) =>
      @outPorts.out.send rendered

  prepareLiquid: ->
    liquid.readTemplateFile = (path) =>
      @templates[path]

  templateName: (templatePath) ->
    path.basename templatePath, path.extname templatePath

  addInclude: (template) ->
    name = @templateName template.path
    @includes[name] = template

  parseTemplate: (templateName) ->
    unless @includes[templateName]
      @error new Error "Template #{templateName} not found"
      return

    try
      liquid.Template.parse @includes[templateName].body
    catch e
      @error e

  error: (error) ->
    return unless @outPorts.error.isAttached()
    @outPorts.error.send e
    @outPorts.error.disconnect()

exports.getComponent = -> new Template
