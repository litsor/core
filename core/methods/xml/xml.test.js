'use strict';

module.exports = {
  tests: [{
    can: 'convert single element',
    input: {
      tagName: 'root',
      content: 'test'
    },
    output: '<?xml version="1.0" encoding="UTF-8">\n<root>test</root>'
  }, {
    can: 'add attributes',
    input: {
      tagName: 'root',
      attributes: {
        foo: 'bar',
        bar: 'baz'
      },
      content: 'test'
    },
    // Note that attributes are sorted.
    output: '<?xml version="1.0" encoding="UTF-8">\n<root bar="baz" foo="bar">test</root>'
  }, {
    can: 'add namespace',
    input: {
      tagName: 'root',
      namespace: 'a',
      attributes: {
        'xmlns:a': 'http://example.com/a'
      },
      content: 'test'
    },
    // Note that attributes are sorted.
    output: '<?xml version="1.0" encoding="UTF-8">\n<a:root xmlns:a="http://example.com/a">test</a:root>'
  }, {
    can: 'add child elements',
    input: {
      tagName: 'root',
      children: [{
        tagName: 'name',
        content: 'John'
      }, {
        tagName: 'age',
        content: '40'
      }]
    },
    // Note that attributes are sorted.
    output: '<?xml version="1.0" encoding="UTF-8">\n<root><name>John</name><age>40</age></root>'
  }, {
    can: 'use self-closing elements',
    input: {
      tagName: 'root'
    },
    // Note that attributes are sorted.
    output: '<?xml version="1.0" encoding="UTF-8">\n<root/>'
  }, {
    can: 'escape special characters in content',
    input: {
      tagName: 'root',
      content: '<"Hello & world">'
    },
    // Note that attributes are sorted.
    output: '<?xml version="1.0" encoding="UTF-8">\n<root>&lt;&quot;Hello &amp; world&quot;&gt;</root>'
  }, {
    can: 'escape special characters in attributes',
    input: {
      tagName: 'root',
      attributes: {
        content: '<"Hello & world">'
      }
    },
    // Note that attributes are sorted.
    output: '<?xml version="1.0" encoding="UTF-8">\n<root content="&lt;&quot;Hello &amp; world&quot;&gt;"/>'
  }]
};
