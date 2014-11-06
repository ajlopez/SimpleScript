
var simplescript = require('../');

function compile(text) {
    return simplescript.compile(text);
}

exports['Compile integer'] = function (test) {
    test.equal(compile('123'), '123;');
}

exports['Compile string without quotes inside'] = function (test) {
    test.equal(compile("'foo'"), "'foo';");
    test.equal(compile('"foo"'), "'foo';");
}

exports['Compile name'] = function (test) {
    test.equal(compile("foo"), "var foo; foo;");
}

exports['Compile indexed name'] = function (test) {
    test.equal(compile("foo[1]"), "var foo; foo[1];");
}

exports['Unclosed command'] = function (test) {
    test.throws(function() {
        compile('foo bar');
    },
    function(err) {
        test.ok(err);
        test.equal(err, "unexpected 'bar'");
        return true;
    });
}

exports['Compile if'] = function (test) {
    test.equal(compile("if a b"), "var a, b; if (a) { b; }");
    test.equal(compile("if a\n b\n end"), "var a, b; if (a) { b; }");
}

exports['Compile if with else'] = function (test) {
    test.equal(compile("if a b else c"), "var a, b, c; if (a) { b; } else { c; }");
    test.equal(compile("if a\nb\nelse\nc\nend"), "var a, b, c; if (a) { b; } else { c; }");
    test.equal(compile("if a\n b\n c\nend"), "var a, b, c; if (a) { b; c; }");
}

exports['Unclosed if command'] = function (test) {
    test.throws(function() {
        compile('if a\nb');
    },
    function(err) {
        test.ok(err);
        test.equal(err, "expected 'end'");
        return true;
    });
}

exports['Compile commands'] = function (test) {
    test.equal(compile("a\nb\n"), "var a, b; a; b;");
    test.equal(compile("if a b\nif c d"), "var a, b, c, d; if (a) { b; } if (c) { d; }");
    test.equal(compile("a=1"), "var a; a = 1;");
    test.equal(compile("a+=1"), "var a; a += 1;");
    test.equal(compile("a-=1"), "var a; a -= 1;");
    test.equal(compile("a*=2"), "var a; a *= 2;");
    test.equal(compile("a/=3"), "var a; a /= 3;");
    test.equal(compile("a=b"), "var a, b; a = b;");
}

exports['Compile assign to indexed name'] = function (test) {
    test.equal(compile("a[2]=1"), "var a; a[2] = 1;");
    test.equal(compile("a[1]+=1"), "var a; a[1] += 1;");
    test.equal(compile("a[1]-=1"), "var a; a[1] -= 1;");
    test.equal(compile("a[2]*=2"), "var a; a[2] *= 2;");
    test.equal(compile("a[1]/=3"), "var a; a[1] /= 3;");
    test.equal(compile("a[2]=b"), "var a, b; a[2] = b;");
}

exports['Compile external call'] = function (test) {
    test.equal(compile("print('hello')"), "print('hello');");
}


