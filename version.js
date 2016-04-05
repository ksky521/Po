var pkg = require('./package');
module.exports = function() {
    var content = [
        '',
        '██████╗  ██████╗',
        '██╔══██╗██╔═══██╗',
        '██████╔╝██║   ██║',
        '██╔═══╝ ██║   ██║',
        '██║     ╚██████╔╝',
        '╚═╝      ╚═════╝ ',
        '    v' + pkg.version
    ];
    console.log(content.join('\n'));
}
