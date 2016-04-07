var fis = module.exports = require('fis3');
var path = require('path');
fis.require.prefixes.unshift('po');
fis.cli.name = 'po';
fis.cli.info = require('./package.json');
fis.set('server.type', 'smarty');
var cwd = process.cwd();
var sets;
var defaultSets = sets = {
  'namespace': '',
  'static': 'static',
  'template': 'template',
  'smarty': {
    'left_delimiter': '{%',
    'right_delimiter': '%}'
  }
};
try {
  sets = require(path.join(cwd, 'config.json'));
  fis.util.map(defaultSets, function(key, value) {
    if (!sets[key]) {
      sets[key] = value;
    }
  });
} catch (e) {}

fis.cli.version = require('./version.js');


var matchRules = {
  '*': {
    release: '/${namespace}/$0'
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
  '/(**.tpl)': {
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
  '*.{tpl,js,ejs,scss,css,less}': {
    useSameNameRequire: true
  },
  '*.{js,ejs,scss,css,less}': {
    useSameNameRequire: true,
    postprocessor: function(content, file) {
      file.extras.hash = file.getHash();
      // console.log(file.extras, file.getHash());
      return content;
    }
  },

  // widget
  '/(widget/**).tpl': {
    url: '${namespace}/$1',
    release: '/${template}/${namespace}/$1',
    useMap: true
  },
  '/widget/{*.{js,scss,ejs,less,css},**/*.{js,scss,ejs,less,css}}': {
    isMod: true,
    release: '/${static}/$0'
  },
  '/{plugin/**.*,smarty.conf,domain.conf,**.php}': {
    release: '$0'
  },

  //mods
  '/mods/**': {
    release: '/${static}/$0'
  },
  '/mods/**.{js,scss,css}': {
    isMod: true
  },
  '/mods/**.ejs': {
    rExt: '.js',
    isJsLike: true,
    isMod: true,
    parser: require('./plugins/parser/ejs')
  },
  '/mods/(**).ejs': {
    release: '/${static}/mods/$1-t'
  },
  // static
  '/static/(**)': {
    release: '/${static}/$1'
  },
  'static/**.{js,scss,css}': {
    isMod: true
  },
  '/static/jslib/**': {
    isMod: false
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
  '.svn/**',
  '*.md',
  'LICENSE',
  'plugin/{*.md,test/**}'
]);


fis.util.map(['domain'], function(i, v) {
  if (sets[v]) {
    fis.util.map(sets[v], function(s, rule) {
      fis.match(s, {
        domain: rule
      })
    })
    delete sets[v];
  }
});

if (sets.deploy) {
  fis.util.map(sets.deploy, function(s, r) {
    fis.match(s, {
      deploy: fis.plugin('http-push', r)
    })
  });
  delete sets.deploy;
}

fis.util.map(sets, function(key, value) {
  fis.set(key, value);
});



fis.util.map(matchRules, function(selector, rules) {
  fis.match(selector, rules);
});

//正则match
fis
  .match(/\/_(.*)\.(js|css|scss|less)$/, {
    release: false,
    useMap: false
  })
  .match(/\/_(.*)\.ejs/, {
    parser: fis.plugin('ejs'),
    isMod: false,
    useMap: false,
    release: false
  })
  .match(/^\/(test|config)\/(.*)/, {
    useMap: false,
    release: '/$1/${namespace}/$2'
  })


// 所有js, css 加 hash
fis
  .media('prod')
  .match('*.sh', {
    release: false
  })
  .match('*.{js,ejs}', {
    optimizer: fis.plugin('uglify-js')
  })
  .match('*.{css,less,scss}', {
    optimizer: fis.plugin('clean-css')
  })
  .match('*.png', {
    optimizer: fis.plugin('png-compressor')
  })
  .match('*.{js,css,sass,scss,ejs,less}', {
    useHash: true
  })
  .match('::image', {
    useHash: true
  })
  .match('*.{tpl,js,css,html,htm}', {
    parser: fis.plugin('jdists', {
      remove: 'debug,test'
    })
  })
  .match('/test/**', {
    release: false
  })

// default media is `dev`，
fis.media('dev')
  .match('*', {
    useHash: false,
    optimizer: null
  });


// 模块化支持
fis.hook('commonjsx', {
  withHash: true
});

//添加插件

// map.json
fis.match('::package', {
  postpackager: [require('./plugins/postpackager/map'), fis.plugin('loader', {
    allInOne: true
  })]
});
//alias
Object.defineProperty(global, 'po', {
  enumerable: true,
  writable: false,
  value: fis
});
