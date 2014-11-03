
'use strict';

var lexer = (function () {
    var TokenType = { Name: 1, Integer: 2, String: 3, NewLine: 4, Separator: 5, Assignment: 6 };
    var separators = ".,()[]";
    var assignments = ["=", "+=", "-=", "*=", "/="];
    var operators = ["+", "-", "*", "/", "==", "!=", "<", ">", "<=", ">="];

    function Token(value, type) {
        this.value = value;
        this.type = type;
    }

    function Lexer(text) {
        var length = text ? text.length : 0;
        var position = 0;
        var next = [];

        this.nextToken = function () {
            if (next.length > 0)
                return next.pop();

            skipSpaces();

            var ch = nextChar();

            if (ch === null)
                return null;

            if (ch === '"' || ch === "'")
                return nextString(ch);

            if (ch === '\n')
                return new Token(ch, TokenType.NewLine);

            if (ch === '\r') {
                var ch2 = nextChar();

                if (ch2 === '\n')
                    return new Token(ch + ch2, TokenType.NewLine);

                if (ch2)
                    pushChar(ch2);

                return new Token(ch, TokenType.NewLine);
            }

            if (isAssignment(ch))
                return new Token(ch, TokenType.Assignment);

            if (isOperator(ch))
                return nextOperator(ch);

            if (isSeparator(ch))
                return new Token(ch, TokenType.Separator);

            if (isFirstCharOfName(ch))
                return nextName(ch);

            if (isDigit(ch))
                return nextInteger(ch);
        }

        this.pushToken = function(token) {
            if (token)
                next.push(token);
        }

        function nextString(quote) {
            var value = '';

            for (var ch = nextChar(); ch && ch !== quote; ch = nextChar())
                value += ch;

            if (!ch)
                throw "unclosed string";

            return new Token(value, TokenType.String);
        }

        function nextName(ch) {
            var value = ch;

            for (ch = nextChar(); ch && isCharOfName(ch); ch = nextChar())
                value += ch;

            if (ch)
                pushChar(ch);

            return new Token(value, TokenType.Name);
        }

        function nextInteger(ch) {
            var value = ch;

            for (ch = nextChar(); ch && isDigit(ch); ch = nextChar())
                value += ch;

            if (ch)
                pushChar(ch);

            return new Token(value, TokenType.Integer);
        }

        function nextOperator(ch) {
            var ch2 = nextChar();

            if (ch2 && isAssignment(ch + ch2))
                return new Token(ch + ch2, TokenType.Assignment);

            if (ch2 && isOperator(ch + ch2))
                return new Token(ch + ch2, TokenType.Operator);

            return new Token(ch, TokenType.Operator);
        }

        function nextChar() {
            if (position >= length)
                return null;

            return text[position++];
        }

        function skipSpaces() {
            for (var ch = nextChar(); ch && isSpace(ch);)
                ch = nextChar();

            if (ch)
                pushChar(ch);
        }

        function pushChar(ch) {
            if (ch)
                position--;
        }

        function isAssignment(value) {
            return assignments.indexOf(value) >= 0;
        }

        function isSeparator(ch) {
            return separators.indexOf(ch) >= 0;
        }

        function isOperator(value) {
            return operators.indexOf(value) >= 0;
        }

        function isFirstCharOfName(ch) {
            return isLetter(ch) || ch === '_';
        }

        function isCharOfName(ch) {
            return isLetter(ch) || isDigit(ch) || ch === '_';
        }

        function isDigit(ch) {
            return ch >= '0' && ch <= '9';
        }

        function isLetter(ch) {
            return ch >= 'a' && ch <= 'z' || ch >= 'A' && ch <= 'Z';
        }

        function isSpace(ch) {
            return ch <= ' ' && ch !== '\n' && ch !== '\r';
        }
    }

    return {
        lexer: function (text) { return new Lexer(text); },
        TokenType: TokenType
    }
})();

if (typeof window === 'undefined')
	module.exports = lexer;

