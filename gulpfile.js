const gulp          = require('gulp');
const $             = require('gulp-load-plugins')();
const browser       = require('browser-sync').create();
const exec          = require('child_process').execSync;
const imageResize   = require('gulp-image-resize');
const changed       = require('gulp-changed');
const rename        = require('gulp-rename');
const imagemin      = require('gulp-imagemin');

var dev = false;

var sassPaths = [
  'node_modules/normalize.scss/sass',
  'node_modules/foundation-sites/scss',
  'node_modules/motion-ui/src'
];

gulp.task('scss', scss);
gulp.task('js', js);
gulp.task('media', gulp.series(mediaMove, mediaMedium, mediaLarge, mediaCropped));
gulp.task('images', images);
gulp.task('hugo:dev', hugoDev);
gulp.task('hugo:prod', hugoProd);
gulp.task('start', gulp.series(gulp.parallel('scss', 'js'), 'media', 'images', 'hugo:dev', watch, server));
gulp.task('build', gulp.series(gulp.parallel('scss', 'js'), 'media', 'images', 'hugo:prod'));
gulp.task('default', gulp.series('start'));

function scss() {
  return gulp.src(['src/scss/**/*.scss'])
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

function js() {
  return gulp.src(['src/js/**/*.js'])
    .pipe($.uglify()
      .on('error', e => { console.log(e); })
    )
    .pipe(gulp.dest('public/js'));
}

function mediaMove() {
  return gulp.src(['media/**/*']).pipe(gulp.dest('public/media'));
}
  
function _media(attrs) {
  var filename = "-" + attrs.width + (attrs.hasOwnProperty("height") ? "x" + attrs.height : "");
  return gulp.src('media/**/*')
      .pipe(imageResize(attrs))
      .pipe(imagemin([
        imagemin.gifsicle({interlaced: true}),
        imagemin.jpegtran({progressive: true}),
        imagemin.optipng({optimizationLevel: 5})
      ], { verbose: true }))
      .pipe(rename(function (path){ path.basename += filename; }))
      .pipe(gulp.dest('public/media'));
}

function mediaCropped() {
  return _media({ width: 600, height: 400, crop: true, upscale: true, quality: 0.9, noProfile: true });
}

function mediaMedium() {
  return _media({ width: 600, quality: 0.9, noProfile: true });
}

function mediaLarge() {
  return _media({ width: 1200, quality: 0.9, noProfile: true });
}

function images() {
  return gulp.src('src/images/**/*')
  .pipe(changed('public/images'))
  .pipe(imagemin([
    imagemin.gifsicle({interlaced: true}),
    imagemin.jpegtran({progressive: true}),
    imagemin.optipng({optimizationLevel: 5})
  ], { verbose: true }))
  .pipe(gulp.dest('public/images'));
}

function watch(done) {
  gulp.watch(['src/scss/**/*.scss'], gulp.series('scss', reload));
  gulp.watch(['src/js/**/*.js'], gulp.series('js', reload));
  gulp.watch(['media/**/*'], gulp.series('media', reload));
  gulp.watch(['src/images/**/*'], gulp.series('images', reload));
  gulp.watch(['content/**/*', 'gulpfile.js'], gulp.series('hugo:dev', reload));
  gulp.watch(['src/**/*', '!src/scss/**/*.scss', '!src/images/**/*', '!src/js/**/*.js'], gulp.series('hugo:dev', reload));
  done();
}

function hugo(done) {
  var cwd = process.cwd();
  var cmd = 'hugo --gc --source=' + cwd + ' --buildDrafts=' + dev;
  try {
    var result = exec(cmd, {encoding: 'utf-8'});
    console.log(result);
  } catch(e) {
    console.log(e.stdout);
    throw e;
  }
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
