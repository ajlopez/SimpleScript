
var simplescript = require('../').complete();
    
var Lexer = simplescript.Lexer;
var TokenType = simplescript.TokenType;

exports['nextToken defined'] = function (test) {
    var lexer = new simplescript.Lexer();

    test.ok(lexer.nextToken);
    test.equal(typeof lexer.nextToken, 'function');
}

exports['Get null'] = function (test) {
    var lexer = new simplescript.Lexer(null);
    test.equal(lexer.nextToken(), null);
}

function getToken(text, value, type, test) {
    var lexer = new Lexer(text);
    var token = lexer.nextToken();
    test.ok(token);
    test.equal(token.value, value);
    test.equal(token.type, type);
    test.equal(lexer.nextToken(), null);
};

exports['Get names'] = function (test) {
    getToken('foo', 'foo', TokenType.Name, test);
    getToken('foo123', 'foo123', TokenType.Name, test);
    getToken('foo_123', 'foo_123', TokenType.Name, test);
    getToken('_foo', '_foo', TokenType.Name, test);
}

exports['Get integer'] = function (test) {
    getToken('123', '123', TokenType.Integer, test);
    getToken('1234567890', '1234567890', TokenType.Integer, test);
}

exports['Skip spaces'] = function (test) {
    getToken('  foo   ', 'foo', TokenType.Name, test);
    getToken('  123   ', '123', TokenType.Integer, test);
}

exports['Get simple double quoted string'] = function (test) {
    getToken('"foo"', 'foo', TokenType.String, test);
    getToken('"123"', '123', TokenType.String, test);
}

exports['Get simple single quoted string'] = function (test) {
    getToken("'foo'", 'foo', TokenType.String, test);
    getToken("'123'", '123', TokenType.String, test);
}

exports['Unclosed string'] = function (test) {
    test.throws(function() {
        var lexer = new Lexer('"foo');
        lexer.nextToken();
    },
    function(err) {
        test.ok(err);
        test.equal(err, 'unclosed string');
        return true;
    });
}

exports['New line'] = function (test) {
    getToken('\n', '\n', TokenType.NewLine, test);
    getToken('\r\n', '\r\n', TokenType.NewLine, test);
    getToken('\r', '\r', TokenType.NewLine, test);
}

exports['Separators'] = function (test) {
    getToken('.', '.', TokenType.Separator, test);
    getToken(',', ',', TokenType.Separator, test);
    getToken('(', '(', TokenType.Separator, test);
    getToken(')', ')', TokenType.Separator, test);
}

exports['Operators'] = function (test) {
    getToken('+', '+', TokenType.Operator, test);
    getToken('-', '-', TokenType.Operator, test);
    getToken('*', '*', TokenType.Operator, test);
    getToken('/', '/', TokenType.Operator, test);
}

exports['Assigments'] = function (test) {
    getToken('=', '=', TokenType.Assignment, test);
    getToken('+=', '+=', TokenType.Assignment, test);
    getToken('-=', '-=', TokenType.Assignment, test);
    getToken('*=', '*=', TokenType.Assignment, test);
    getToken('/=', '/=', TokenType.Assignment, test);
}
