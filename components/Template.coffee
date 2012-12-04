noflo = require 'noflo'
liquid = require 'liquid-node'
path = require 'path'

class Template extends noflo.Component
  constructor: ->
    @includes = {}
    @parsed = {}

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

  getTemplate: (templateName) ->
    unless @includes[templateName]
      @error new Error "Template #{templateName} not found"
      return

    template = @includes[templateName]
    if @includes[templateName].layout
      parent = @getTemplate @includes[templateName].layout
      if parent
        template.body = parent.replace '{{ content }}', template.body
    template.body

  parseTemplate: (templateName) ->
    return @parsed[templateName] if @parsed[templateName]

    try
      @parsed[templateName] = liquid.Template.parse @getTemplate templateName
    catch e
      @error e
    @parsed[templateName]

  error: (error) ->
    return unless @outPorts.error.isAttached()
    @outPorts.error.send e
    @outPorts.error.disconnect()

exports.getComponent = -> new Template
