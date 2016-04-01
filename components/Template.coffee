noflo = require 'noflo'
liquid = require 'liquid-node'
path = require 'path'

# Our local additional tags
includeTag = require '../tags/include.coffee'

# We include Jekyll-style filters by default
jekFilters = require '../filter/jekyll.coffee'

class Template extends noflo.Component
  constructor: ->
    @includes = {}
    @variables = null
    @template = null
    @disconnected = false

    @groups = []

    @inPorts =
      includes: new noflo.Port 'object'
      template: new noflo.Port 'string'
      variables: new noflo.Port 'object'
    @outPorts =
      out: new noflo.Port 'string'
      error: new noflo.Port 'object'

    @inPorts.includes.on 'data', (data) =>
      @addInclude data

    @inPorts.includes.on 'disconnect', =>
      do @handleDisconnect

    @inPorts.template.on 'begingroup', (group) =>
      @groups.push group

    @inPorts.template.on 'data', (data) =>
      if @variables
        @render data, @variables, @groups.slice 0
        @variables = null
        return
      @template =
        template: data
        group: @groups.slice 0

    @inPorts.template.on 'endgroup', =>
      @groups.pop()

    @inPorts.template.on 'disconnect', =>
      do @handleDisconnect
      @groups = []

    @inPorts.variables.on 'data', (data) =>
      if @template
        @render @template.template, data, @template.group
        @template = null
        return
      @variables = data

    @inPorts.variables.on 'disconnect', =>
      do @handleDisconnect

  handleDisconnect: ->
    return if @inPorts.includes.isConnected()
    return if @inPorts.template.isConnected()
    return if @inPorts.variables.isConnected()
    @disconnected = true

  render: (template, data, groups) ->
    @parseTemplate template, (err, tmpl) =>
      unless tmpl
        @outPorts.out.send ''
        @outPorts.out.disconnect() if @disconnected
        return
      tmpl.render data
      .then (rendered) =>
        for group in groups
          @outPorts.out.beginGroup group
        @outPorts.out.send rendered
        for group in groups
          @outPorts.out.endGroup group
        @outPorts.out.disconnect() if @disconnected

  includeName: (templatePath) ->
    path.basename templatePath

  addInclude: (template) ->
    name = @includeName template.path
    @includes[name] = template.body

  parseTemplate: (template, callback) ->
    engine = new liquid.Engine
    includeTag.registerInclude engine, (includeName) => @includes[includeName]
    engine.registerFilters jekFilters
    engine.parse template
    .then (tmpl) ->
      callback null, tmpl
    .catch (e) ->
      callback e

  error: (error) ->
    return unless @outPorts.error.isAttached()
    @outPorts.error.send error
    @outPorts.error.disconnect()

exports.getComponent = -> new Template
