
var simplescript = require('../'),
    assert = require('assert');
    
// Lexer defined

assert.ok(simplescript.Lexer);

var Lexer = simplescript.Lexer;

// TokenType defined

assert.ok(simplescript.TokenType);

var TokenType = simplescript.TokenType;

// nextToken defined

var lexer = new simplescript.Lexer();

assert.ok(lexer.nextToken);
assert.equal(typeof lexer.nextToken, 'function');

// Get null

var lexer = new simplescript.Lexer(null);
assert.equal(lexer.nextToken(), null);

function getToken(text, value, type) {
    var lexer = new Lexer(text);
    var token = lexer.nextToken();
    assert.ok(token);
    assert.equal(token.value, value);
    assert.equal(token.type, type);
    assert.equal(lexer.nextToken(), null);
};

// Get names

getToken('foo', 'foo', TokenType.Name);
getToken('foo123', 'foo123', TokenType.Name);
getToken('foo_123', 'foo_123', TokenType.Name);
getToken('_foo', '_foo', TokenType.Name);

// Get integer

getToken('123', '123', TokenType.Integer);
getToken('1234567890', '1234567890', TokenType.Integer);
