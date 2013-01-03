
var simplescript = require('../..'),
    util = require('util'),
    fs = require('fs');

var print = util.print;

function runFile(filename) {
    var text = fs.readFileSync(filename).toString();
    var code = simplescript.compile(text);
    eval(code);
};

process.argv.forEach(function(val) {
    if (val.slice(-3) == ".ss")
        runFile(val);
});

