
var simplescript = require('../'),
    assert = require('assert');
    
// Parser defined

assert.ok(simplescript.Parser);

var Parser = simplescript.Parser;

// parseCommand defined

var parser = new Parser();

assert.ok(parser.parseCommand);
assert.equal(typeof parser.parseCommand, 'function');

function compileCommand(text) {
    var parser = new Parser(text);
    var expr = parser.parseCommand();
    assert.ok(expr);
    var code = expr.compile();
    assert.ok(code);
    assert.equal(parser.parseCommand(), null);
    return code;
}

// Compile integer

assert.equal(compileCommand('123'), '123;');

// Compile string without quotes inside

assert.equal(compileCommand("'foo'"), "'foo';");
assert.equal(compileCommand('"foo"'), "'foo';");

// Compile name

assert.equal(compileCommand("foo"), "foo;");