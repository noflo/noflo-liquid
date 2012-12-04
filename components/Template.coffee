noflo = require 'noflo'
liquid = require 'liquid-node'
path = require 'path'

class Template extends noflo.Component
  constructor: ->
    @includes = {}
    @variables = null
    @template = null

    @inPorts =
      includes: new noflo.Port()
      template: new noflo.Port()
      variables: new noflo.Port()
    @outPorts =
      out: new noflo.Port()
      error: new noflo.Port()

    @inPorts.includes.on 'data', (data) =>
      @addInclude data

    @inPorts.template.on 'data', (data) =>
      if @variables
        @render data, @variables
        @variables = null
        return
      @template = data

    @inPorts.template.on 'disconnect', =>
      @outPorts.out.disconnect() unless @inPorts.variables.isConnected()

    @inPorts.variables.on 'data', (data) =>
      if @template
        @render @template, data
        @template = null
        return
      @variables = data

    @inPorts.variables.on 'disconnect', =>
      @outPorts.out.disconnect() unless @inPorts.template.isConnected()

  render: (template, data) ->
    tmpl = @parseTemplate template
    promise = tmpl.render data
    promise.done (rendered) =>
      @outPorts.out.send rendered

  templateName: (templatePath) ->
    path.basename templatePath, path.extname templatePath

  addInclude: (template) ->
    name = @templateName template.path
    @includes[name] = template

  parseTemplate: (template) ->
    try
      return liquid.Template.parse template
    catch e
      @error e

  error: (error) ->
    return unless @outPorts.error.isAttached()
    @outPorts.error.send e
    @outPorts.error.disconnect()

exports.getComponent = -> new Template
