
var ssparser = require('../lib/parser');

exports['parseExpression defined'] = function (test) {
    var parser = ssparser.parser();

    test.ok(parser.parseExpression);
    test.equal(typeof parser.parseExpression, 'function');
}

function compileExpression(text, test) {
    var parser = ssparser.parser(text);
    var expr = parser.parseExpression();
    test.ok(expr);
    var code = expr.compile();
    test.ok(code);
    test.equal(parser.parseExpression(), null);
    return code;
}

exports['Compile integer'] = function (test) {
    test.equal(compileExpression('123', test), '123');
}

exports['Compile string without quotes inside'] = function (test) {
    test.equal(compileExpression("'foo'", test), "'foo'");
    test.equal(compileExpression('"foo"', test), "'foo'");
}

exports['Compile name'] = function (test) {
    test.equal(compileExpression("foo", test), "foo");
}

exports['Qualified name'] = function (test) {
    test.equal(compileExpression("foo.bar", test), "foo.bar");
}

exports['Invalid qualified name'] = function (test) {
    test.throws(function() {
        var parser = ssparser.parser("foo.123");
        parser.parseExpression();
    },
    function(err) {
        test.ok(err);
        test.equal(err, 'name expected');
        return true;
    });
}

