const jsPath = '/include/js/',
	cssPath = '/include/css/';

// 所有文件，都使用相对路径
fis.hook('relative');
fis.match('**', {
	relative: true
});

// 启用指纹戳
fis.match('*.{js,css,png,svg,ico}', {
	useHash: true
});

// libs 目录下的文件不压缩
fis.match('/include/libs/(**.js)', {
	release: jsPath + '$1',
	useHash: false
});

// 压缩 js
fis.match(jsPath + '(**.js)', {
	optimizer: fis.plugin('uglify-js'),
	release: jsPath + '$1'
});

// 处理 css
fis.match(cssPath + '(*.scss)', {
	parser: fis.plugin('node-sass'),  // 编译 sass, require: fis-parser-node-sass
	optimizer: fis.plugin('clean-css'),  // 压缩 css
	postprocessor: fis.plugin('autoprefixer-latest', {  // 处理 css 前缀, require: fis3-postprocessor-autoprefixer-latest
		browsers: ['last 4 versions', '> 5%', 'ie 9']
	}),
	rExt: '.css',  // 后缀名
	release: cssPath + '$1'
});

// 压缩 svg HTML
// require: fis3-optimizer-html
fis.match('/include/images/**.html', {
	optimizer: fis.plugin('html', {
		option: {
			collapseWhitespace: true,
			removeComments: true
		}
	})
});

// 不发布配置文件
fis.match('/package*.json', {
	release: false
});

// 不发布下划线开头的文件夹
fis.match('_*/*.*', {
	release: false
});
