readenv = require "../components/Template"
socket = require('noflo').internalSocket
fs = require 'fs'

setupComponent = ->
  c = readenv.getComponent()
  layouts = socket.createSocket()
  includes = socket.createSocket()
  ins = socket.createSocket()
  out = socket.createSocket()
  c.inPorts.layouts.attach layouts
  c.inPorts.includes.attach includes
  c.inPorts.in.attach ins
  c.outPorts.out.attach out
  [c, layouts, includes, ins, out]

exports['test simple Liquid Template'] = (test) ->
  test.expect 1
  [c, layouts, includes, ins, out] = setupComponent()
  out.once 'data', (data) ->
    test.equal data, 'Hello, Foo!'
    test.done()

  layouts.send
    path: '/foo/bar/user.html'
    body: 'Hello, {{ current_user }}!'
  ins.send
    layout: 'user'
    current_user: 'Foo'

exports['test complex Liquid Template'] = (test) ->
  test.expect 3
  [c, layouts, includes, ins, out] = setupComponent()
  out.once 'data', (data) ->
    test.notEqual data.indexOf('<title>Hello, World - foo</title>'), -1
    test.notEqual data.indexOf('<title>First post</title>'), -1
    test.notEqual data.indexOf('<title>Second post</title>'), -1
    test.done()

  template = "#{__dirname}/fixtures/feed.html"
  layouts.send
    path: template
    body: fs.readFileSync template, 'utf-8'
  ins.send
    layout: 'feed'
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

exports['test Liquid Template inheritance'] = (test) ->
  test.expect 3
  [c, layouts, includes, ins, out] = setupComponent()
  out.once 'data', (data) ->
    test.notEqual data.indexOf('<content>'), -1
    test.notEqual data.indexOf('Hello, Foo!'), -1
    test.notEqual data.indexOf('</content>'), -1
    test.done()

  # Base template
  template = "#{__dirname}/fixtures/base.html"
  layouts.send
    path: template
    body: fs.readFileSync template, 'utf-8'
  # Inherited template
  template = "#{__dirname}/fixtures/child.html"
  layouts.send
    path: template
    body: fs.readFileSync template, 'utf-8'
    layout: 'base'

  ins.send
    layout: 'child'
    name: 'Foo'
