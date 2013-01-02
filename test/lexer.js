
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

// Get name

var lexer = new simplescript.Lexer('foo');
var token = lexer.nextToken();
assert.ok(token);
assert.equal(token.value, 'foo');
assert.equal(token.type, TokenType.Name);
assert.equal(lexer.nextToken(), null);

