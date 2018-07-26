'use strict';

module.exports = `
{ ws=explicit }
script ::= WS* (command|comment)? (NL WS* (command|comment))* WS*

comment ::= "#" ([#x09 #x20-#x7E])* {fragment=true}
block ::= "{{" script "}}" {fragment=true}

SP                   ::= [#x20#x09]+   /* Space | Tab */
NL                   ::= [#x20#x09#x0A#x0D]+   /*
 */

name ::= [_a-zA-Z0-9][_a-zA-Z0-9]*
name_fragment ::= [_a-zA-Z0-9][_a-zA-Z0-9]* {fragment=true}

command ::= assignment? SP* expression SP* {pin=1}

assignment ::= jsonpointer SP* assignment_operator

assignment_operator ::= "[]=" | "=[]" | "+[]" | "-[]" | "+=" | "-=" | "/=" | "*=" | "~" | "="

expression ::= binary_expression | if_statement | query_statement | unary_expression | grouped_expression | value | block

if_statement ::= "if" WS* "(" expression ")" WS* expression_nb (WS* "else" WS* expression)?
query_statement ::= query_type WS* query
query_type ::= "query" | "mutation"

grouped_expression ::= "(" expression ")" {fragment=true}
unary_expression ::= unary_operator SP* expression {pin=2}
binary_expression ::= expression_nb SP* binary_operator SP* expression {pin=3}
expression_nb ::= if_statement | query_statement | unary_expression | grouped_expression | value | block

unary_operator ::= method_name | "!"
binary_operator ::= method_name | "+" | "-" | "*" | "/" | "^" | "===" | "==" | "!==" | "!=" | "<=" | ">=" | "<" | ">"
method_name ::= [a-z][a-zA-Z0-9]*

value ::= json | root_jsonpointer | jsonpointer

/* https://tools.ietf.org/html/rfc6901 */
/* Non-printable and UTF8 characters are not allowed */
jsonpointer    ::= jsonpointer_ne | "/" string | "/"
jsonpointer_ne    ::= "/" name_fragment ( "/" name_fragment )* {fragment=true}
root_jsonpointer    ::= "/" jsonpointer

/* https://www.ietf.org/rfc/rfc4627.txt */
json                ::= false | null | true | object | array | number | string
BEGIN_ARRAY          ::= WS* #x5B WS*  /* [ left square bracket */
BEGIN_OBJECT         ::= WS* #x7B WS*  /* { left curly bracket */
END_ARRAY            ::= WS* #x5D  /* ] right square bracket */
END_OBJECT           ::= WS* #x7D  /* } right curly bracket */
NAME_SEPARATOR       ::= WS* #x3A WS*  /* : colon */
VALUE_SEPARATOR      ::= WS* #x2C WS*  /* , comma */
WS                   ::= [#x20#x09#x0A#x0D]+   /* Space | Tab |
 */
false                ::= "false"
null                 ::= "null"
true                 ::= "true"
object               ::= BEGIN_OBJECT (member (VALUE_SEPARATOR member)*)? END_OBJECT
member               ::= member_name NAME_SEPARATOR expression | rest_operator
member_name          ::= name | expression
array                ::= BEGIN_ARRAY ((rest_operator|expression) (VALUE_SEPARATOR (rest_operator|expression) )*)? END_ARRAY
number                ::= "-"? ("0" | [1-9] [0-9]*) ("." [0-9]+)? (("e" | "E") ( "-" | "+" )? ("0" | [1-9] [0-9]*))?
string                ::= '"' (([#x20-#x21] | [#x23-#x5B] | [#x5D-#xFFFF]) | #x5C (#x22 | #x5C | #x2F | #x62 | #x66 | #x6E | #x72 | #x74 | #x75 HEXDIG HEXDIG HEXDIG HEXDIG))* '"'
rest_operator ::= "..." expression
HEXDIG                ::= [a-fA-F0-9]

/* GraphQL query */

query ::= selections {fragment=true}
selections ::= "{" WS* selection ((WS* "," WS* | WS*) WS* selection)* WS* "}"
selection ::= query_field | query_fragment
query_field ::= field_alias? name (WS* "(" WS* param (WS* "," WS* param)* WS* ")")? (WS* selections)?
field_alias ::= name ":" WS*
param ::= name WS* ":" WS* (false|null|true|number|string|value|constant)
graphql_type ::= ("[" [_a-zA-Z0-9][_a-zA-Z0-9]* "!"? "]" "!"? | [_a-zA-Z0-9][_a-zA-Z0-9]* "!"?)
constant ::= [_a-zA-Z0-9][_a-zA-Z0-9]*
query_fragment ::= "..." WS* "on" WS+ name WS* selections
`;
