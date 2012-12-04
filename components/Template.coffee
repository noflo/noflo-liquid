noflo = require 'noflo'
liquid = require 'liquid-node'
path = require 'path'

# Our local additional tags
includeTag = require '../tags/include.coffee'

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

    includeTag.registerInclude (includeName) =>
      @includes[includeName]

  render: (template, data) ->
    tmpl = @parseTemplate template
    return unless tmpl
    promise = tmpl.render data
    promise.done (rendered) =>
      @outPorts.out.send rendered

  includeName: (templatePath) ->
    path.basename templatePath

  addInclude: (template) ->
    name = @includeName template.path
    @includes[name] = template.body

  parseTemplate: (template) ->
    try
      return liquid.Template.parse template
    catch e
      @error e

  error: (error) ->
    console.log error
    return unless @outPorts.error.isAttached()
    @outPorts.error.send error
    @outPorts.error.disconnect()

exports.getComponent = -> new Template
