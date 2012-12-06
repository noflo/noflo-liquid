Liquid = require 'liquid-node'

exports.registerInclude = (getter) ->
  class Include extends Liquid.Tag
    constructor: (tagName, markup, tokens) ->
      @includeName = markup.trim()
      @parsed = {}
      super

    getPartial: (name) ->
      return @parsed[name] if @parsed[name]
      template = getter name
      return unless template
      @parsed[name] = Liquid.Template.parse template

    render: (context) ->
      partial = @getPartial @includeName
      try
        return partial.render context
      catch e
        return ''

  Liquid.Template.registerTag 'include', Include
