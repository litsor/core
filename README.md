Minimalistic Web Application Framework as Promised
==================

[![Build Status](https://travis-ci.org/mauritsl/bluegate.svg?branch=master)](https://travis-ci.org/mauritsl/bluegate)
[![Coverage Status](https://coveralls.io/repos/mauritsl/bluegate/badge.svg?branch=master)](https://coveralls.io/r/mauritsl/bluegate?branch=master)
[![Dependency Status](https://david-dm.org/mauritsl/bluegate.svg)](https://david-dm.org/mauritsl/bluegate)

BlueGate is a simple framework to build web applications in NodeJS.
It is build on top of the powerful
[Bluebird](https://github.com/petkaantonov/bluebird) library to let you
use the ease of Promises to its fullest extent.

Instead of a simple stack with middleware, BlueGate has a sophisticated
request flow that fits both REST API's and complex multi-tier applications.

## Installation

Install using ``npm install bluegate``

## Quick example

```javascript
var BlueGate = require('bluegate');

var app = new BlueGate();
app.listen(8080);

app.postvalidation('GET /user/<id:int>', function(id) {
  if (id === 123) {
    throw Error('This is not a valid user id');
  }
});
app.process('GET /user/<id:int>', function(id) {
  // Return page content or promise for content.
  return {id: id};
});

app.process('GET /user/<id:int>/picture', function(id) {
  this.mime = 'image/jpeg';
  return new Buffer('...');
);
```

## Request flow

Each request follows the steps below:

- ``initialize`` can be used to register request specific handlers
- ``authentication`` should be used to identify the client
- ``authorisation`` should be used for permission checks
- ``prevalidation`` does validation before preprocessing
- ``preprocess`` does the preprocessing (e.g. parsing body)
- ``postvalidation`` does validation after preprocessing
- ``process`` will generate the output
- ``postprocess`` can alter the output (e.g. for templating)
- send response to client
- ``after`` is for additional work (e.g. statistics)

All remaining steps are skipped when an error occur before sending the response,
In that case, we will arrive at the error-flow:

- ``error`` is used to generate the error response for the client
- send response to client
- ``aftererror`` is for additional work (e.g. statistics)

The name of each step is used as function name to register handlers for it.
This can be done on the BlueGate instance (as shown in the example above) or
on the ``this`` scope within a handler. The first argument is in the form
``METHOD /path`` and determines which requests it can handle. This argument
can be omitted to enable the handler for all requests.

## Writing handlers

### Input

Handler functions can accept input via both function arguments and the local
scope (``this``).
Input from path parameters is mapped to function arguments. Function arguments
that do not have a parameter will get ``undefined`` as value.

```javascript
app.process('GET /user/<name:string>', function(type, name) {
  typeof type === 'undefined';
  typeof name === 'string';
});
```

Other input is available in the local scope, accessible with ``this.*``.
The table below lists all available variables.

Name       | Type    | Example               | Read only?
-----------|---------|-----------------------|-----------
host       | string  | www.example.com       | yes
path       | string  | /user/john            | yes
method     | string  | GET                   | yes
body       | buffer* |                       | yes
mime       | string  | text/html             | no
status     | int     | 200                   | no
query      | object  | ['page']              | yes
headers    | object  | {'User-Agent': '...'} | yes
cookies    | object  | ['sessionId']         | yes
ip         | string  | 127.0.0.1             | yes
date       | date    |                       | yes
secure     | bool    | false                 | yes
parameters | object  | {...}                 | yes

* Body is an object for JSON and urlencoded input.

### Path parameters

Path parameters are passed as function arguments, as shown in the last code
example. The following types are available:

Type     | Description
---------|--------------------------------------------------------
alpha    | Alpha characters (a-z A-Z)
alphanum | Alphanumeric characters (a-z A-Z 0-9)
bool     | Boolean (matches "1", "0", "true" and "false")
float    | Floats (e.g. -34.3, .3 or 63)
int      | Positive integer (1..n). Does not match 0.
path     | Matches all characters including forward slashes ("/")
signed   | Signed integer (e.g. -123, 0 or 123)
string   | Matches all characters except forward slashes ("/")
unsigned | Unsigned integer (0..n)
uuid     | Matches UUID versions 1 to 5

Accepting path parameters via function arguments should be preferred above using
``this.parameters``. The last object was added to allow abstract functions to
handle multiple callbacks.

It is possible to set new parameters or override existing using ``setParameter``
inside a handler. This is illustrated in the following example:

```javascript
app.initialize('GET /path/<foo:string>', function(foo) {
  this.setParameter('foo', 'bar');
});
app.process('GET /path/<foo:string>', function(foo) {
  // foo == "bar", independent from the actual path argument.
});
```

The ``setParameter`` function requires two arguments; name and value. The value
is *not* casted to the type defined in the path.

### Query arguments

Values from the path query ("/news?page=34") can be retreived using
``this.getQuery``. The first argument is the name and the second is the value
type. A default value can be provided as thirth argument (defaults to ``null``).
The default value is returned when the variable is missing or its value does not
match the requested type.

```javascript
app.process('GET /news', function() {
  var page = this.getQuery('page', 'int', 1);
});
```

An array of all available query variables is available in ``this.query``. This
contains a list of names only, to enforce validation when getting the value.

### Output

Output is provided as return value. This can be provided as strings, buffer,
readable stream or any JSON serializable value. The MIME-type defaults to
"text/html" when using strings, "application/octet-stream" for buffers and
stream and "application/json" for other types. JSON output is automatically
encoded.

Use ``this.mime`` to set a different MIME-type.

```javascript
app.process('GET /image', function() {
  this.mime = 'image/jpeg';
  return fs.createReadStream('image.jpg');
});
```

### Cookies

Read cookies using ``getCookie``. This is similar to ``getQuery``. The names of
all provided cookies can be found in ``this.cookies``.

```javascript
app.authentication(function() {
  var sessionId = this.getCookie('sessionId', 'alphanum');
});
```

Use the ``setCookie`` function to set a cookie. Arguments are:

- Name
  May not contain whitespace, comma, semicolon, equals sign or non-printable
  characters.
- Value
  May not contain whitespace, comma, semicolon or non-printable characters.
- Expires
  Given as JavaScript ``Date``-object. Optional, defaults to not expiration
  date (session cookie).
- Path
  E.g. "/forum". Optional.
- Domain
  E.g. ".example.com". Optional.
- HttpOnly
  Set HttpOnly flag. Given as boolean. Optional, defaults to ``true``.
- Secure
  Set Secure flag. Given as boolean. Optional, defaults to ``true`` when
  visited over SSL.
  
Example:

```javascript
app.preprocess('POST /login', function() {
  var sessionId = '...';
  var date = new Date();
  date.setDate(date.getDate() + 14);
  
  // Set a session cookie.
  this.setCookie('sessionId', sessionId);
  
  // Expires after 2 weeks.
  this.setCookie('sessionId', sessionId, date);
  
  // Only on /forum.
  this.setCookie('sessionId', sessionId, null, '/forum');
  
  // Set for example.com and all subdomains.
  this.setCookie('sessionId', sessionId, null, null, '.example.com'); 
});
```

### HTTP headers

HTTP headers can be set using the ``setHeader`` function.

```javascript
app.preprocess('GET /path', function() {
  this.setHeader('X-Generator', 'CMS');
});
```

An optional thirth argument can be provided to append headers instead of
replacing them.

```javascript
app.preprocess('GET /path', function() {
  this.setHeader('Cache-Control', 'no-cache', true);
  this.setHeader('Cache-Control', 'no-store', true);
});
```

### HTTP status code

The HTTP status code is 200 by default. This code is changed automatically
when an error occurs. The HTTP status for errors is dependent on the phase in
which the error occurred.

Phase              | Code | Message
-------------------|------|------------------------
``initialize``     | 500  | Internal server error
``authentication`` | 401  | Authentication required
``authorisation``  | 403  | Permission denied
``prevalidation``  | 400  | Bad request
``preprocess``     | 500  | Internal server error
``postvalidation`` | 400  | Bad request
``process``        | 500  | Internal server error
``postprocess``    | 500  | Internal server error

Additionally, a ``404`` response ("Not found") is provided when no ``process``
handler was found. All phases before ``process`` are still executed, because
it is possible that those will register a ``process`` handler.

It is possible to override the status code from within a handler using
``this.status``.

```javascript
app.process('POST /object', function() {
  this.status = 201;
  return {messages: ['Created']);
});
```

## Logging

BlueGate will log requests to console by default. You can change this behaviour
in the constructor options.

```javascript
var server = new BlueGate({
  log: false, // or:
  log: function(message) { ... }
});
```

The format of the log messages is:

```
2015-05-26T21:15:05 127.0.0.1 "GET /host-test" 200 16 143
 \- Start of request  |           |            |  |   |
                      \ Client IP |            |  |   |
                                  \ Request    |  |   |
                                 Response code /  |   |
                           Response size (bytes)  /   |
                                  Response time (ms)  /
```

No settings are available to change this format. You can disable logging and
register an ``after`` / ``aftererror`` handler for custom logging. 

## Security

### Running behind a proxy server

When you are running behind a proxy server, you should set the
``trustedProxies`` option. This contains a list of IP-addresses used by your
proxy servers. The default value for this list is ``127.0.0.1``. All proxies
must add the IP-address to the ``X-Forwarded-For`` header. The ``this.ip``
variable used in handlers will contain the client IP, even when the client tries
to spoof the IP-address by sending a false ``X-Forwarded-For`` header.

```javascript
var app = new BlueGate({
  trustedProxies: ['192.168.1.10', '192.168.1.11']
});
```

### Running behind SSL

The ``this.secure`` variable in handles indicates if the client is using HTTPS
for this request. This flag relies on the ``X-Forwarded-Proto`` header, which
should be set by reverse proxies (which may require extra configuration).
This value can be spoofed by the client.

Cookies are set with the Secure flag by default when running behind SSL. It's
possible to remove it by setting the 7th argument of ``setCookie`` to ``false``.

### Clickjacking

All HTML responses will include the HTTP-header ``X-Frame-Options: deny`` to
prevent [clickjacking](https://www.owasp.org/index.php/Clickjacking) attacks.
It is set to the most strict setting by default. You can change its setting in
the constructor when you use iframes. Strings are used as header value. Use
``false`` to completely remove this header.

```javascript
var app = new BlueGate({
  clickjacking: 'sameorigin'
});
```

### MIME-sniffing

All responses will include the header ``X-Content-Type-Options: nosniff`` by
default. This helps to prevent
[MIME-sniffing](http://en.wikipedia.org/wiki/Content_sniffing) attacks. You
should leave this header in and make sure that the MIME-type is set correctly.
However, you can disable this feature in the constructor.

```javascript
var app = new BlueGate({
  noMimeSniffing: false
});
```

### Maximum input size

A ``maxInputSize`` option is available. This limits the number of bytes
accepted in the request body. The default value is 1048576 (1MB). You should
lower this value if large requests aren't used to avoid DoS attacks.

```javascript
var app = new BlueGate({
  maxInputSize: 1024 * 64 // 64 KB
});
```
