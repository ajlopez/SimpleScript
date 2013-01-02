
var simplescript = require('../'),
    assert = require('assert');
    
// Parser defined

assert.ok(simplescript.Parser);

var Parser = simplescript.Parser;

// parseExpression defined

var parser = new Parser();

assert.ok(parser.parseExpression);
assert.equal(typeof parser.parseExpression, 'function');

function compileExpression(text) {
    var parser = new Parser(text);
    var expr = parser.parseExpression();
    assert.ok(expr);
    var code = expr.compile();
    assert.ok(code);
    assert.equal(parser.parseExpression(), null);
    return code;
}

// Compile integer

assert.equal(compileExpression('123'), '123');

// Compile string without quotes inside

assert.equal(compileExpression("'foo'"), "'foo'");
assert.equal(compileExpression('"foo"'), "'foo'");

// Compile name

assert.equal(compileExpression("foo"), "foo");

// Qualified name

assert.equal(compileExpression("foo.bar"), "foo.bar");

// Invalid qualified name

assert.throws(function() {
    var parser = new Parser("foo.123");
    parser.parseExpression();
},
function(err) {
    assert.ok(err);
    assert.equal(err, 'name expected');
    return true;
});

