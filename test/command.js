
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

// Unclosed command

assert.throws(function() {
    var parser = new Parser('foo bar');
    parser.parseCommand();
},
function(err) {
    assert.ok(err);
    assert.equal(err, "unexpected 'bar'");
    return true;
});

// Compile if

assert.equal(compileCommand("if a b"), "if (a) { b; }");
assert.equal(compileCommand("if a\n b\n end"), "if (a) { b; }");

// Compile if with else

assert.equal(compileCommand("if a b else c"), "if (a) { b; } else { c; }");
assert.equal(compileCommand("if a\nb\nelse\nc\nend"), "if (a) { b; } else { c; }");
assert.equal(compileCommand("if a\n b\n c\nend"), "if (a) { b; c; }");

// Unclosed if command

assert.throws(function() {
    var parser = new Parser('if a\nb');
    parser.parseCommand();
},
function(err) {
    assert.ok(err);
    assert.equal(err, "expected 'end'");
    return true;
});

