
'use strict';

var simplescript = (function () {
    var TokenType = { Name: 1, Integer: 2, String: 3, NewLine: 4, Separator: 5, Assignment: 6 };
    var separators = ".,()";
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

    function NameExpression(name) {
        this.isLeftValue = true;

        this.compile = function () {
            return name;
        };

        this.getName = function () {
            return name;
        }

        this.collectContext = function (context) {
            context.declare(name);
        }
    }

    function QualifiedNameExpression(expr, name) {
        this.isLeftValue = true;

        this.compile = function () {
            return expr.compile() + '.' + name;
        };

        this.collectContext = function (context) {
            expr.collectContext(context);
        }
    }

    function IntegerExpression(value) {
        this.compile = function () {
            return value;
        };

        this.collectContext = function (context) {
        }
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

        this.collectContext = function (context) {
        };
    }

    function CallExpression(target, args) {
        this.compile = function() {
            var code = target.compile() + '(';

            for (var k = 0; k < args.length; k++) {
                if (k)
                    code += ', ';
                code += args[k].compile();
            }

            return code + ')';
        };

        this.collectContext = function (context) {
            target.collectContext(context);
            for (var k = 0; k < args.length; k++)
                args[k].collectContext(context);
        };
    }

    function AssignmentCommand(target, oper, expr) {
        this.compile = function () {
            return target.compile() + ' ' + oper + ' ' + expr.compile() + ';';
        };

        this.collectContext = function(context) {
            target.collectContext(context);
            expr.collectContext(context);
        };
    }

    function ExpressionCommand(expr) {
        this.compile = function () {
            return expr.compile() + ';';
        };

        this.collectContext = function (context) {
            expr.collectContext(context);
        };
    }

    function IfCommand(cond, thencmd, elsecmd) {
        this.compile = function () {
            var code = 'if (' + cond.compile() + ') { ' + thencmd.compile() + ' }';
            if (elsecmd)
                code += ' else { ' + elsecmd.compile() + ' }';
            return code;
        };

        this.collectContext = function (context) {
            cond.collectContext(context);
            thencmd.collectContext(context);
            if (elsecmd)
                elsecmd.collectContext(context);
        }
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

        this.collectContext = function (context) {
            for (var k = 0; k < n; k++)
                cmds[k].collectContext(context);
        }
    }

    function Parser(text) {
        var lexer = new Lexer(text);
        var self = this;
        var exprfollowers = ['.', '('];

        this.parseExpression = function () {
            var expr = parseTerm();

            if (expr === null)
                return null;

            for (var token = lexer.nextToken(); isExpressionFollower(token); token = lexer.nextToken()) {
                if (token.value === '.') {
                    var newexpr = parseTerm();
                    if (!(newexpr instanceof NameExpression))
                        throw 'name expected';
                    expr = new QualifiedNameExpression(expr, newexpr.getName());
                }
                else if (token.value === '(') {
                    var args = parseExpressionList();
                    parseToken(')', TokenType.Separator);
                    return new CallExpression(expr, args);
                }
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

        function parseExpressionList() {
            var exprs = [];

            for (var expr = self.parseExpression(); expr; expr = self.parseExpression()) {
                exprs.push(expr);

                if (!tryParseToken(',', TokenType.Separator))
                    break;
            }

            return exprs;
        }

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

            if (expr.isLeftValue) {
                var oper = tryParseAssignment();
                if (oper)
                    return new AssignmentCommand(expr, oper, self.parseExpression());
            }

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

            lexer.pushToken(token);
        };

        function parseToken(value, type) {
            var token = lexer.nextToken();
            if (!token || token.type != type || token.value != value)
                throw "expected '" + value + "'";
        }

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

        function tryParseAssignment() {
            var token = lexer.nextToken();
            if (token === null)
                return null;
            if (token.type === TokenType.Assignment)
                return token.value;
            lexer.pushToken(token);
            return null;
        }

        function tryParseToken(value, type) {
            var token = lexer.nextToken();

            if (token && token.type === type && token.value === value)
                return true;

            lexer.pushToken(token);
            return false;
        }

        function isExpressionFollower(token) {
            if (!token)
                return false;

            return exprfollowers.indexOf(token.value) >= 0;
        }
    }

    function Context() {
        var locals = [];
        var globals = [];
        var externals = [];

        this.declare = function (name) {
            if (locals.indexOf(name) < 0 && globals.indexOf(name) < 0 && externals.indexOf(name) < 0)
                locals.push(name);
        };

        this.compileLocals = function () {
            if (!locals.length)
                return '';

            var code = 'var ';

            for (var k = 0; k < locals.length; k++) {
                if (k)
                    code += ', ';
                code += locals[k];
            }

            return code + ';';
        };
    };

    function compile(text) {
        var parser = new Parser(text);

        var cmds = parser.parseCommands();
        var context = new Context();
        cmds.collectContext(context);
        var vars = context.compileLocals();

        var code = cmds.compile(context);

        if (vars)
            return vars + ' ' + code;

        return code;
    }

    return {
        compile: compile,
        // for testing purpose
        complete: function () {
            this.Lexer = Lexer;
            this.TokenType = TokenType;
            this.Parser = Parser;
            return this;
        }
    }
})();

if (typeof window === 'undefined') {
	module.exports = simplescript;
}
