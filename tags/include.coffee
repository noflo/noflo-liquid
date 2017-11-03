Liquid = require 'liquid-node'

exports.registerInclude = (engine, getter) ->
  class Include extends Liquid.Tag
    constructor: (tagName, markup, tokens) ->
      super arguments...
      @includeName = tokens.trim()
      @parsed = {}

    getPartial: (name) ->
      return @parsed[name] if @parsed[name]
      template = getter name
      return unless template
      @parsed[name] = engine.parse template

    render: (context) ->
      partial = @getPartial @includeName
      partial.then (p) ->
        p.render context

  engine.registerTag 'include', Include
