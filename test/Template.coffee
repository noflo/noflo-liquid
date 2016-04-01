readenv = require "../components/Template"
socket = require('noflo').internalSocket
fs = require 'fs'

setupComponent = ->
  c = readenv.getComponent()
  includes = socket.createSocket()
  template = socket.createSocket()
  variables = socket.createSocket()
  out = socket.createSocket()
  c.inPorts.includes.attach includes
  c.inPorts.template.attach template
  c.inPorts.variables.attach variables
  c.outPorts.out.attach out
  [c, includes, template, variables, out]

exports['test simple Liquid Template'] = (test) ->
  test.expect 1
  [c, includes, template, variables, out] = setupComponent()

  out.once 'data', (data) ->
    test.equal data, 'Hello, Foo!'
    test.done()

  template.send 'Hello, {{ current_user }}!'
  variables.send
    current_user: 'Foo'

exports['test complex Liquid Template'] = (test) ->
  test.expect 4
  [c, includes, template, variables, out] = setupComponent()
  out.once 'data', (data) ->
    test.notEqual data.indexOf('<items>2</items>'), -1
    test.notEqual data.indexOf('<title>Hello, World - Foo</title>'), -1
    test.notEqual data.indexOf('<title>First post</title>'), -1
    test.notEqual data.indexOf('<title>Second post</title>'), -1
    test.done()

  variables.send
    site:
      name: 'Hello, World'
      categories:
        foo: [
            title: 'First post',
            content: '<p><a href="/foo">My page</a></p>'
            date: new Date
          ,
            title: 'Second post',
            content: '<p><a href="/foo">My page</a></p>'
            date: new Date
        ]
    page:
      categorization: 'foo'

  templateFile = "#{__dirname}/fixtures/feed.html"
  template.send fs.readFileSync templateFile, 'utf-8'

exports['test Liquid Template custom strip_html filter'] = (test) ->
  test.expect 1
  [c, includes, template, variables, out] = setupComponent()

  out.once 'data', (data) ->
    test.equal data, 'Hello World!'
    test.done()

  template.send '{{ content | strip_html }}'
  variables.send
    content: '<p class="foo">Hello <i>World</i>!</p>'

exports['test Liquid Template custom date_to_string filter'] = (test) ->
  test.expect 1
  [c, includes, template, variables, out] = setupComponent()

  out.once 'data', (data) ->
    test.equal data, '8 Aug 2013'
    test.done()

  template.send '{{ content | date_to_string }}'
  variables.send
    content: '2013-08-08 12:12:06'

exports['test Liquid Template custom date_to_xmlschema filter'] = (test) ->
  test.expect 1
  [c, includes, template, variables, out] = setupComponent()

  out.once 'data', (data) ->
    test.equal data, '2013-08-08T10:12:06.000Z'
    test.done()

  template.send '{{ content | date_to_xmlschema }}'
  variables.send
    content: 'Fri, 8 Aug 2013 12:12:06 GMT+0200'

exports['test Liquid Template custom number_of_words filter'] = (test) ->
  test.expect 1
  [c, includes, template, variables, out] = setupComponent()

  out.once 'data', (data) ->
    test.equal data, '7'
    test.done()

  template.send '{{ content | number_of_words }}'
  variables.send
    content: "Hello world
    it is
      a nice day"
exports['test Liquid Template includes'] = (test) ->
  test.expect 3
  [c, includes, template, variables, out] = setupComponent()

  out.once 'data', (data) ->
    test.notEqual data.indexOf('<content>'), -1
    test.notEqual data.indexOf('Hello, Foo'), -1
    test.notEqual data.indexOf('</content>'), -1
    test.done()

  includeFile = "#{__dirname}/fixtures/username.html"
  includes.send
    path: includeFile
    body: fs.readFileSync includeFile, 'utf-8'

  templateFile = "#{__dirname}/fixtures/test_include.html"
  template.send fs.readFileSync templateFile, 'utf-8'

  variables.send
    name: 'Foo'
