module.exports = function createMap(ret) {

  var path = require('path')
  var root = fis.project.getProjectPath();
  var map = fis.file.wrap(path.join(root, fis.get('namespace') ? fis.get('namespace') + '-map.json' : 'map.json'));;
  map.setContent(JSON.stringify(ret.map, null, map.optimizer ? null : 2));
  ret.pkg[map.subpath] = map;
}
