'use strict';

module.exports = {
  tests: [{
    can: ' convert single element',
    input: '<?xml version="1.0" encoding="UTF-8">\n<root>test</root>',
    output: {
      tagName: 'root',
      content: 'test'
    }
  }, {
    can: ' add attributes',
    input: '<?xml version="1.0" encoding="UTF-8">\n<root bar="baz" foo="bar">test</root>',
    output: {
      tagName: 'root',
      attributes: {
        foo: 'bar',
        bar: 'baz'
      },
      content: 'test'
    }
  }, {
    can: ' add namespace',
    input: '<?xml version="1.0" encoding="UTF-8">\n<a:root xmlns:a="http://example.com/a">test</a:root>',
    output: {
      tagName: 'root',
      namespace: 'a',
      attributes: {
        'xmlns:a': 'http://example.com/a'
      },
      content: 'test'
    }
  }, {
    can: ' add child elements',
    input: '<?xml version="1.0" encoding="UTF-8">\n<root><name>John</name><age>40</age></root>',
    output: {
      tagName: 'root',
      children: [{
        tagName: 'name',
        content: 'John'
      }, {
        tagName: 'age',
        content: '40'
      }]
    }
  }, {
    can: 'use self-closing elements',
    input: '<?xml version="1.0" encoding="UTF-8">\n<root/>',
    output: {
      tagName: 'root'
    }
  }, {
    can: 'escape special characters in content',
    input: '<?xml version="1.0" encoding="UTF-8">\n<root>&lt;&quot;Hello &amp; world&quot;&gt;</root>',
    output: {
      tagName: 'root',
      content: '<"Hello & world">'
    }
  }, {
    can: 'escape special characters in attributes',
    input: '<?xml version="1.0" encoding="UTF-8">\n<root content="&lt;&quot;Hello &amp; world&quot;&gt;"/>',
    output: {
      tagName: 'root',
      attributes: {
        content: '<"Hello & world">'
      }
    }
  }],
};
