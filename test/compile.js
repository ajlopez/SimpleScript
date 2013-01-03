
var simplescript = require('../'),
    assert = require('assert');

// compile defined

assert.ok(simplescript.compile);
assert.equal(typeof simplescript.compile, 'function');

function compile(text) {
    return simplescript.compile(text);
}

assert.equal(compile('123'), '123;');

// Compile string without quotes inside

assert.equal(compile("'foo'"), "'foo';");
assert.equal(compile('"foo"'), "'foo';");

// Compile name

assert.equal(compile("foo"), "var foo; foo;");

// Unclosed command

assert.throws(function() {
    compile('foo bar');
},
function(err) {
    assert.ok(err);
    assert.equal(err, "unexpected 'bar'");
    return true;
});

// Compile if

assert.equal(compile("if a b"), "var a, b; if (a) { b; }");
assert.equal(compile("if a\n b\n end"), "var a, b; if (a) { b; }");

// Compile if with else

assert.equal(compile("if a b else c"), "var a, b, c; if (a) { b; } else { c; }");
assert.equal(compile("if a\nb\nelse\nc\nend"), "var a, b, c; if (a) { b; } else { c; }");
assert.equal(compile("if a\n b\n c\nend"), "var a, b, c; if (a) { b; c; }");

// Unclosed if command

assert.throws(function() {
    compile('if a\nb');
},
function(err) {
    assert.ok(err);
    assert.equal(err, "expected 'end'");
    return true;
});

// Compile commands

assert.equal(compile("a\nb\n"), "var a, b; a; b;");
assert.equal(compile("if a b\nif c d"), "var a, b, c, d; if (a) { b; } if (c) { d; }");
