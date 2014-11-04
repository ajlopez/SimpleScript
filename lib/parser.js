
'use strict';

var lexer;

if (typeof lexer == 'undefined')
    lexer = require('./lexer');

var parser = (function () {
    var TokenType = lexer.TokenType;
    
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

    function IndexedExpression(expr, indexpr) {
        this.isLeftValue = true;

        this.compile = function () {
            return expr.compile() + '[' + indexpr.compile() + ']';
        };

        this.collectContext = function (context) {
            expr.collectContext(context);
        }
    }

    function NegateExpression(expr) {
        this.compile = function () {
            return '-' + expr.compile();
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
    
    function createLexer(text) {
        return lexer.lexer(text);
    }

    function Parser(text) {
        var lexer = createLexer(text);
        var self = this;
        var exprfollowers = ['.', '(', '['];

        this.parseExpression = function () {
            var expr = parseSimpleTerm();

            if (expr === null)
                return null;

            for (var token = lexer.nextToken(); isExpressionFollower(token); token = lexer.nextToken()) {
                if (token.value === '.') {
                    var newexpr = parseSimpleTerm();
                    if (!(newexpr instanceof NameExpression))
                        throw 'name expected';
                    expr = new QualifiedNameExpression(expr, newexpr.getName());
                }
                else if (token.value === '(') {
                    var args = parseExpressionList();
                    parseToken(')', TokenType.Separator);
                    return new CallExpression(expr, args);
                }
                else if (token.value === '[') {
                    var arg = this.parseExpression();
                    parseToken(']', TokenType.Separator);
                    return new IndexedExpression(expr, arg);
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
        
        function parseSimpleTerm() {
            var token = lexer.nextToken();

            if (token === null)
                return null;
                
            if (token.type == TokenType.Operator)
                if (token.value == '-')
                    return new NegateExpression(parseSimpleTerm());
                else if (token.value == '+')
                    return parseSimpleTerm();
                
            lexer.pushToken(token);
            
            return parseTerm();
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

    return {
        parser: function (text) { return new Parser(text); }
    }
})();

if (typeof window === 'undefined')
	module.exports = parser;

