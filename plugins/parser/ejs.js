var ejs = require('ejs');
module.exports = function (content, file, conf) {
  var id = conf.filename = file.getId();
  conf.client = true;
  content = ejs.compile(content, conf).toString();
  content = content.replace(/^function\s+anonymous(?=\()/, 'function');
  var code = ['module.exports = ', content, ';'].join('');
  return code;
};
