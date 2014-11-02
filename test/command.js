
var ssparser = require('../lib/parser');

exports['parseCommand defined'] = function (test) {
    var parser = ssparser.parser();

    test.ok(parser.parseCommand);
    test.equal(typeof parser.parseCommand, 'function');
}

exports['parseCommands defined'] = function (test) {
    var parser = ssparser.parser();

    test.ok(parser.parseCommands);
    test.equal(typeof parser.parseCommands, 'function');
}

function compileCommand(text, test) {
    var parser = ssparser.parser(text);
    var cmd = parser.parseCommand();
    test.ok(cmd);
    var code = cmd.compile();
    test.ok(code);
    test.equal(parser.parseCommand(), null);
    return code;
}

function compileCommands(text, test) {
    var parser = ssparser.parser(text);
    var cmd = parser.parseCommands();
    test.ok(cmd);
    var code = cmd.compile();
    test.ok(code);
    test.equal(parser.parseCommand(), null);
    return code;
}

exports['Compile integer'] = function (test) {
    test.equal(compileCommand('123', test), '123;');
}

exports['Compile string without quotes inside'] = function (test) {
    test.equal(compileCommand("'foo'", test), "'foo';");
    test.equal(compileCommand('"foo"', test), "'foo';");
}

exports['Compile name'] = function (test) {
    test.equal(compileCommand("foo", test), "foo;");
}

exports['Unclosed command'] = function (test) {
    test.throws(function() {
        var parser = ssparser.parser('foo bar');
        parser.parseCommand();
    },
    function(err) {
        test.ok(err);
        test.equal(err, "unexpected 'bar'");
        return true;
    });
}

exports['Compile if'] = function (test) {
    test.equal(compileCommand("if a b", test), "if (a) { b; }");
    test.equal(compileCommand("if a\n b\n end", test), "if (a) { b; }");
}

exports['Compile if with else'] = function (test) {
    test.equal(compileCommand("if a b else c", test), "if (a) { b; } else { c; }");
    test.equal(compileCommand("if a\nb\nelse\nc\nend", test), "if (a) { b; } else { c; }");
    test.equal(compileCommand("if a\n b\n c\nend", test), "if (a) { b; c; }");
}

exports['Unclosed if command'] = function (test) {
    test.throws(function() {
        var parser = ssparser.parser('if a\nb');
        parser.parseCommand();
    },
    function(err) {
        test.ok(err);
        test.equal(err, "expected 'end'");
        return true;
    });
}

exports['Compile commands'] = function (test) {
    test.equal(compileCommands("a\nb\n", test), "a; b;");
    test.equal(compileCommands("if a b\nif c d", test), "if (a) { b; } if (c) { d; }");
}

exports['Compile assign commands'] = function (test) {
    test.equal(compileCommands("a = 1", test), "a = 1;");
    test.equal(compileCommands("a += 1", test), "a += 1;");
    test.equal(compileCommands("a -= 1", test), "a -= 1;");
    test.equal(compileCommands("a *= 1", test), "a *= 1;");
    test.equal(compileCommands("a /= 1", test), "a /= 1;");
}

exports['Compile call'] = function (test) {
    test.equal(compileCommand("print()", test), "print();");
    test.equal(compileCommand("print('hello')", test), "print('hello');");
    test.equal(compileCommand("print('hello', ' ', 'Adam')", test), "print('hello', ' ', 'Adam');");
}
