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
  test.expect 3
  [c, includes, template, variables, out] = setupComponent()
  out.once 'data', (data) ->
    test.notEqual data.indexOf('<title>Hello, World - foo</title>'), -1
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
