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
  'node_modules/foundation-sites/scss'
];

gulp.task('scss', scss);
gulp.task('media', media);
gulp.task('resize', resize);
gulp.task('optimize', optimize);
gulp.task('hugo:dev', hugoDev);
gulp.task('hugo:prod', hugoProd);

gulp.task('start', gulp.series(gulp.parallel('scss', 'optimize', 'resize', 'media', 'hugo:dev'), watch, server));
gulp.task('build', gulp.parallel('scss', 'optimize', 'resize', 'media', 'hugo:prod'));
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

function resize() {
  return gulp.src('media/**/*.{jpg,jpeg,png,gif}')
    .pipe(changed('public/media'))
    .pipe(imageResize({
      width: 600,
      height: 400,
      crop: true,
      upscale: true,
      quality: 0.9,
      noProfile: true
    }))
    .pipe(imagemin([
      imagemin.gifsicle({interlaced: true}),
      imagemin.jpegtran({progressive: true}),
      imagemin.optipng({optimizationLevel: 5})
    ]))
    .pipe(rename(function (path){ path.basename += "-thumb"; }))
    .pipe(gulp.dest('public/media'));
}

function optimize() {
  return gulp.src('media/**/*.{jpg,jpeg,png,gif}')
    .pipe(changed('public/media'))
    .pipe(imagemin([
      imagemin.gifsicle({interlaced: true}),
      imagemin.jpegtran({progressive: true}),
      imagemin.optipng({optimizationLevel: 5})
    ]))
    .pipe(gulp.dest('public/media'));
}

function media() {
  return gulp.src(['media/**/*', '!media/**/*.{jpg,jpeg,png,gif}'])
    .pipe(gulp.dest('public/media'));
}

function watch(done) {
  gulp.watch(['src/scss/**/*.scss'], gulp.series('scss', reload));
  gulp.watch(['media/**/*', '!media/**/*.{jpg,jpeg,png,gif}'], gulp.series('media', reload));
  gulp.watch(['media/**/*.{jpg,jpeg,png,gif}'], gulp.series('optimize', 'resize', reload));
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
