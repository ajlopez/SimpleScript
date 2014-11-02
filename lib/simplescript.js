
'use strict';

var parser;

if (typeof parser == 'undefined')
    parser = require('./parser');

var simplescript = (function () {
    function Context() {
        var locals = [];
        var globals = [];
        var externals = [ "print" ];

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
    
    function createParser(text) {
        return parser.parser(text);
    }

    function compile(text) {
        var parser = createParser(text);

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
        compile: compile
    }
})();

if (typeof window === 'undefined')
	module.exports = simplescript;
    
