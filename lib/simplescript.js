
'use strict';

var simplescript = (function () {
    var TokenType = { Name: 1, Integer: 2, String: 3, NewLine: 4 };

    function Token(value, type) {
        this.value = value;
        this.type = type;
    }

    function Lexer(text) {
        var length = text ? text.length : 0;
        var position = 0;

        this.nextToken = function () {
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

            if (isFirstCharOfName(ch))
                return nextName(ch);

            if (isDigit(ch))
                return nextInteger(ch);
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

    function NameExpression(name) {
        this.compile = function() {
            return name;
        };
    }

    function IntegerExpression(value) {
        this.compile = function() {
            return value;
        };
    }

    function StringExpression(value) {
        var hassingle = value.indexOf("'") >= 0;
        var hasdouble = value.indexOf('"') >= 0;

        var strrep;

        if (!hassingle)
            strrep = "'" + value + "'";
        else if (!hasdouble)
            strrep = '"' + value + '"';

        this.compile = function() {
            return strrep;
        };
    }

    function ExpressionCommand(expr) {
        this.compile = function () {
            return expr.compile() + ';';
        };
    }

    function Parser(text) {
        var lexer = new Lexer(text);

        this.parseExpression = function () {
            var token = lexer.nextToken();

            if (token === null)
                return null;

            if (token.type == TokenType.Integer)
                return new IntegerExpression(token.value);

            if (token.type == TokenType.String)
                return new StringExpression(token.value);

            if (token.type == TokenType.Name)
                return new NameExpression(token.value);
        };

        this.parseCommand = function () {
            var expr = this.parseExpression();

            if (expr === null)
                return null;

            var cmd = new ExpressionCommand(expr);
            parseEndOfCommand();
            return cmd;
        };

        function parseEndOfCommand() {
            var token = lexer.nextToken();
            if (token == null || token.type == TokenType.NewLine)
                return;
            throw "unexpected '" + token.value + "'";
        }
    }

    return {
        Lexer: Lexer,
        TokenType: TokenType,
        Parser: Parser
    }
})();

if (typeof window === 'undefined') {
	module.exports = simplescript;
}
