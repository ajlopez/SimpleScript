
'use strict';

var simplescript = (function () {
    var TokenType = { Name: 1, Integer: 2, String: 3, NewLine: 4, Separator: 5 };
    var separators = ".,()";

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

        function isSeparator(ch) {
            return separators.indexOf(ch) >= 0;
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
        this.compile = function () {
            return name;
        };

        this.getName = function () {
            return name;
        }
    }

    function QualifiedNameExpression(expr, name) {
        this.compile = function () {
            return expr.compile() + '.' + name;
        };
    }

    function IntegerExpression(value) {
        this.compile = function () {
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

    function IfCommand(cond, thencmd, elsecmd) {
        this.compile = function () {
            var code = 'if (' + cond.compile() + ') { ' + thencmd.compile() + ' }';
            if (elsecmd)
                code += ' else { ' + elsecmd.compile() + ' }';
            return code;
        };
    }

    function CompositeCommand(cmds) {
        var n = cmds.length;

        this.compile = function () {
            var code = '';

            for (var k = 0; k < n; k++) {
                if (code)
                    code += ' ';
                code += cmds[k].compile();
            }

            return code;
        };
    }

    function Parser(text) {
        var lexer = new Lexer(text);
        var self = this;

        this.parseExpression = function () {
            var expr = parseTerm();

            if (expr === null)
                return null;

            for (var token = lexer.nextToken(); token && token.type === TokenType.Separator; token = lexer.nextToken()) {
                var newexpr = parseTerm();
                if (!(newexpr instanceof NameExpression))
                    throw 'name expected';
                expr = new QualifiedNameExpression(expr, newexpr.getName());
            }

            if (token)
                lexer.pushToken(token);

            return expr;
        };

        this.parseCommands = function () {
            var cmds = [];

            for (var cmd = this.parseCommand(); cmd; cmd = this.parseCommand())
                cmds.push(cmd);

            if (cmds.length === 1)
                return cmds[0];

            return new CompositeCommand(cmds);
        };

        this.parseCommand = function () {
            var cmd = parseSimpleCommand();

            if (cmd === null)
                return null;

            parseEndOfCommand();

            return cmd;
        };

        function parseSimpleCommand() {
            var token = lexer.nextToken();

            if (token === null)
                return null;

            if (token.type === TokenType.Name) {
                if (token.value === 'if') {
                    var condition = self.parseExpression();
                    var thencmd = parseSuite(['else']);
                    var elsecmd = null;

                    if (tryParseName('else'))
                        elsecmd = parseSuite();

                    return new IfCommand(condition, thencmd, elsecmd);
                }
            }

            lexer.pushToken(token);

            var expr = self.parseExpression();

            if (expr === null)
                return null;

            var cmd = new ExpressionCommand(expr);
            return cmd;
        };

        function parseSuite(followers) {
            if (!tryParseNewLine())
                return parseSimpleCommand();

            var cmds = [];

            for (var token = lexer.nextToken(); token && (token.type !== TokenType.Name || (token.value !== 'end' && (!followers || followers.indexOf(token.value) < 0))); token = lexer.nextToken()) {
                lexer.pushToken(token);
                cmds.push(self.parseCommand());
            }

            if (!token)
                throw "expected 'end'";

            if (token.value !== 'end')
                lexer.pushToken(token);

            if (cmds.length === 1)
                return cmds[0];

            return new CompositeCommand(cmds);
        }
 
        function parseTerm() {
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

        function parseEndOfCommand() {
            var token = lexer.nextToken();
            if (token == null || token.type == TokenType.NewLine)
                return;
            throw "unexpected '" + token.value + "'";
        }

        function tryParseNewLine() {
            var token = lexer.nextToken();

            if (token && token.type === TokenType.NewLine)
                return true;

            lexer.pushToken(token);
            return false;
        }

        function tryParseName(name) {
            return tryParseToken(name, TokenType.Name);
        }

        function tryParseToken(value, type) {
            var token = lexer.nextToken();

            if (token && token.type === type && token.value === value)
                return true;

            lexer.pushToken(token);
            return false;
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
