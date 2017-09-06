var gulp    = require('gulp');
var $       = require('gulp-load-plugins')();
var browser = require('browser-sync').create();
var exec    = require('child_process').execSync;

var dev = false;

var sassPaths = [
  'node_modules/foundation-sites/scss'
];

gulp.task('scss', scss);
gulp.task('media', media);
gulp.task('hugo:dev', hugoDev);
gulp.task('hugo:prod', hugoProd);

gulp.task('start', gulp.series(gulp.parallel('scss', 'media', 'hugo:dev'), watch, server));
gulp.task('build', gulp.parallel('scss', 'media', 'hugo:prod'));
gulp.task('default', gulp.series('start'));

function scss() {
  return gulp.src('src/scss/**/*.scss')
    .pipe($.sass({
      includePaths: sassPaths,
      outputStyle: 'compressed'
    })
      .on('error', $.sass.logError))
    .pipe($.autoprefixer({
      browsers: ['last 2 versions', 'ie >= 9']
    }))
    .pipe(gulp.dest('public/css'));
}

function media() {
  return gulp.src('media/**/*')
    .pipe(gulp.dest('public/media'));
}

function watch(done) {
  gulp.watch(['src/scss/**/*.scss'], gulp.series('scss', reload));
  gulp.watch(['media/**/*'], gulp.series('media', reload));
  gulp.watch(['content/**/*', 'gulpfile.js'], gulp.series('hugo:dev', reload));
  gulp.watch(['src/**/*', '!src/scss/**/*.scss'], gulp.series('hugo:dev', reload));
  done();
}

function hugo(done) {
  var cwd = process.cwd();
  var cmd = 'hugo --source=' + cwd + ' --buildDrafts=' + dev;
  var result = exec(cmd, {encoding: 'utf-8'});
  console.log(result);
  done();
}

function hugoDev(done){
  dev = true; 
  hugo(done);
}

function hugoProd(done){
  dev = false; 
  hugo(done);
}

function server(done) {
  browser.init({
    server: "public", 
    port: 1313
  });
  done();
}

function reload(done) {
  browser.reload();
  done();
}
