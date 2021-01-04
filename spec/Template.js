const noflo = require('noflo');
const chai = require('chai');
const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../');

describe('Template component', () => {
  let c = null;
  let includes = null;
  let template = null;
  let variables = null;
  let out = null;
  let error = null;
  before(() => {
    const loader = new noflo.ComponentLoader(baseDir);
    return loader.load('liquid/Template')
      .then((instance) => {
        c = instance;
      });
  });
  beforeEach(() => {
    includes = noflo.internalSocket.createSocket();
    template = noflo.internalSocket.createSocket();
    variables = noflo.internalSocket.createSocket();
    out = noflo.internalSocket.createSocket();
    error = noflo.internalSocket.createSocket();
    c.inPorts.includes.attach(includes);
    c.inPorts.template.attach(template);
    c.inPorts.variables.attach(variables);
    c.outPorts.out.attach(out);
    c.outPorts.error.attach(error);
  });
  afterEach(() => {
    c.inPorts.includes.detach(includes);
    c.inPorts.template.detach(template);
    c.inPorts.variables.detach(variables);
    c.outPorts.out.detach(out);
    c.outPorts.error.detach(error);
  });

  describe('simple Liquid template', () => it('should replace variables', (done) => {
    error.on('data', done);
    out.on('data', (data) => {
      chai.expect(data).to.equal('Hello, Foo!');
      done();
    });

    template.send('Hello, {{ current_user }}!');
    variables.send({ current_user: 'Foo' });
  }));

  describe('complex Liquid template', () => it('should produce a feed', (done) => {
    error.on('data', done);
    out.on('data', (data) => {
      chai.expect(data).to.contain('<items>2</items>');
      chai.expect(data).to.contain('<title>Hello, World - Foo</title>');
      chai.expect(data).to.contain('<title>First post</title>');
      chai.expect(data).to.contain('<title>Second post</title>');
      done();
    });

    variables.send({
      site: {
        name: 'Hello, World',
        categories: {
          foo: [{
            title: 'First post',
            content: '<p><a href="/foo">My page</a></p>',
            date: new Date(),
          },
          {
            title: 'Second post',
            content: '<p><a href="/foo">My page</a></p>',
            date: new Date(),
          },
          ],
        },
      },
      page: {
        categorization: 'foo',
      },
    });

    const templateFile = `${__dirname}/fixtures/feed.html`;
    template.send(fs.readFileSync(templateFile, 'utf-8'));
  }));

  describe('with custom strip_html filter', () => it('should return the content without HTML tags', (done) => {
    error.on('data', done);
    out.on('data', (data) => {
      chai.expect(data).to.equal('Hello World!');
      done();
    });

    template.send('{{ content | strip_html }}');
    variables.send({ content: '<p class="foo">Hello <i>World</i>!</p>' });
  }));

  describe('with custom date_to_string filter', () => it('should return the content with expected date formatting', (done) => {
    error.on('data', done);
    out.on('data', (data) => {
      chai.expect(data).to.equal('8 Aug 2013');
      done();
    });

    template.send('{{ content | date_to_string }}');
    variables.send({ content: '2013-08-08 12:12:06' });
  }));

  describe('with custom date_to_xmlschema filter', () => it('should return the content with expected date formatting', (done) => {
    error.on('data', done);
    out.on('data', (data) => {
      chai.expect(data).to.equal('2013-08-08T10:12:06.000Z');
      done();
    });

    template.send('{{ content | date_to_xmlschema }}');
    variables.send({ content: 'Fri, 8 Aug 2013 12:12:06 GMT+0200' });
  }));

  describe('with custom number_of_words filter', () => it('should return the content with expected date formatting', (done) => {
    error.on('data', done);
    out.on('data', (data) => {
      chai.expect(data).to.equal('7');
      done();
    });

    template.send('{{ content | number_of_words }}');
    variables.send({
      content: `Hello world 
it is 
a nice day`,
    });
  }));

  describe('with template includes', () => it('should process the include correctly', (done) => {
    error.on('data', done);
    out.on('data', (data) => {
      chai.expect(data).to.equal('<content>\n  Hello, Foo\n\n</content>\n');
      done();
    });

    const includeFile = `${__dirname}/fixtures/username.html`;
    includes.send({
      path: includeFile,
      body: fs.readFileSync(includeFile, 'utf-8'),
    });

    const templateFile = `${__dirname}/fixtures/test_include.html`;
    template.send(fs.readFileSync(templateFile, 'utf-8'));

    variables.send({ name: 'Foo' });
  }));
});
