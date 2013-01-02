
var simplescript = require('../'),
    assert = require('assert');
    
// Parser defined

assert.ok(simplescript.Parser);

var Parser = simplescript.Parser;

// parseExpression defined

var parser = new Parser();

assert.ok(parser.parseExpression);
assert.equal(typeof parser.parseExpression, 'function');

// Compile integer

var parser = new Parser('123');
var expr = parser.parseExpression();
assert.ok(expr);
var code = expr.compile();
assert.ok(code);
assert.equal(code, '123');
assert.equal(parser.parseExpression(), null);

