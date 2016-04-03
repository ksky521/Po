var fis = module.exports = require('fis3');
var path = require('path');
fis.require.prefixes.unshift('po');
fis.cli.name = 'po';
fis.cli.info = require('./package.json');
fis.set('server.type', 'smarty');

fis.cli.version = require('./version.js');
var sets = {
  'namespace': '',
  'static': 'static',
  'template': 'template',
  'smarty': {
    'left_delimiter': '{%',
    'right_delimiter': '%}'
  }
};

var matchRules = {
  '*': {
    release: '/${static}/${namespace}/$0'
  },

  // 文件扩展名
  '*.es6': {
    parser: fis.plugin('translate-es6'),
    rExt: '.js' // .es6 最终修改其后缀为 .js
  },
  '*.less': {
    parser: fis.plugin('less'),
    rExt: '.css'
  },
  '*.scss': {
    rExt: '.css',
    parser: fis.plugin('node-sass', {
      // options...
    })
  },
  '*.tpl': {
    preprocessor: fis.plugin('extlang'),
    optimizer: [
      fis.plugin('smarty-xss'),
      fis.plugin('html-compress')
    ],
    extras: {
      isPage: true
    },
    useMap: true,
    release: '/${template}/${namespace}/$1'
  },
  '*.{tpl,js,ejs,scss,css}': {
    useSameNameRequire: true
  },


  // widget
  '/(widget/**).tpl': {
    url: '${namespace}/$1',
    useMap: true
  },
  '/widget/{*.{js,scss,less,css},**/*.{js,scss,less,css}}': {
    isMod: true
  },
  '/{plugin/**.*,smarty.conf,domain.conf,**.php}': {
    release: '$0'
  },

  //mods
  '/mods/**.{js,scss,css}': {
    isMod: true
  },
  '/mods/**.ejs': {
    rExt: '.js',
    isMod: true,
    parser: require('./plugins/parser/ejs')
  },
  '/mods/(**).ejs': {
    release: '/${static}/${namespace}/mods/$1-t'
  },
  // static
  '/static/(**)': {
    release: '/${static}/${namespace}/$1'
  },
  'static/**.{js,scss,css}': {
    isMod: true
  },
  '/static/jslib/**': {
    isMod: false
  },
  // test & config
  '/test/**': {
    useMap: false,
    release: '/$1/${namespace}/$2'
  },
  '/config/**': {
    useMap: false,
    release: '/$1/${namespace}/$2'
  },
  '${namespace}-map.json': {
    release: '/config/$0'
  },
  'server.conf': {
    release: '/server-conf/${namespace}.conf'
  },
  'po-conf.js': {
    release: false
  },
  '::package': {
    prepackager: [
      fis.plugin('widget-inline')
    ]
  }
};


fis.set('project.ignore', [
  'output/**',
  'node_modules/**',
  '.git/**',
  '.svn/**'
]);

fis.util.map(sets, function (key, value) {
  fis.set(key, value);
});
fis.util.map(matchRules, function (selector, rules) {
  fis.match(selector, rules);
});

//正则match
fis
  .match(/\/_(.*)\.(js|css|scss|less)$/, {
    release: false
  })
  .match(/\/_(.*)\.ejs/, {
    parser: fis.plugin('ejs'),
    isMod: false,
    release: false
  })


// 所有js, css 加 hash
fis.media('prod').match('/test/**', {
  release: false
}).match('*.sh', {
  release: false
}).match('*.js', {
  optimizer: fis.plugin('uglify-js')
}).match('*.{css,less,scss}', {
  optimizer: fis.plugin('clean-css')
}).match('*.png', {
  optimizer: fis.plugin('png-compressor')
}).match('*.{js,css,sass,scss,ejs,less}', {
  useHash: true
}).match('::image', {
  useHash: true
}).match('*.{tpl,js,css,html,htm}', {
  parser: fis.plugin('jdists', {
    remove: 'debug,test'
  })
})

// default media is `dev`，
fis.media('dev').match('*', {
  useHash: false,
  optimizer: null
});


// 模块化支持
fis.hook('commonjs');

//添加插件

// map.json
fis.match('::package', {
  postpackager: [require('./plugins/postpackager/map'), fis.plugin('loader', {})]
});
//alias
Object.defineProperty(global, 'po', {
  enumerable: true,
  writable: false,
  value: fis
});
