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
gulp.task('images', images);
gulp.task('hugo:dev', hugoDev);
gulp.task('hugo:prod', hugoProd);

gulp.task('start', gulp.series(gulp.parallel('scss', 'media', 'images', 'hugo:dev'), watch, server));
gulp.task('build', gulp.parallel('scss', 'media', 'images', 'hugo:prod'));
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

var images = [
  { width: 600, height: 400, crop: true, upscale: true, quality: 0.9, noProfile: true },
  { width: 1200, quality: 0.9, noProfile: true }
];

function media(done) {
  gulp.src(['media/**/*']).pipe(gulp.dest('public/media'));

  images.forEach(function(image){
    var filenameAppend = "-" + 
      image.width + 
      (image.hasOwnProperty("height") ? "x" + image.height : "");

    gulp.src('media/**/*.{jpg,jpeg,png,gif}')
    .pipe(changed('public/media'))
    .pipe(imageResize(image))
    .pipe(imagemin([
      imagemin.gifsicle({interlaced: true}),
      imagemin.jpegtran({progressive: true}),
      imagemin.optipng({optimizationLevel: 5})
    ]))
    .pipe(rename(function (path){ path.basename += filenameAppend; }))
    .pipe(gulp.dest('public/media'));
  });

  done();
}

function images() {
  return gulp.src('src/images/**/*')
  .pipe(changed('public/images'))
  .pipe(imagemin([
    imagemin.gifsicle({interlaced: true}),
    imagemin.jpegtran({progressive: true}),
    imagemin.optipng({optimizationLevel: 5})
  ]))
  .pipe(gulp.dest('public/images'));
}

function watch(done) {
  gulp.watch(['src/scss/**/*.scss'], gulp.series('scss', reload));
  gulp.watch(['media/**/*'], gulp.series('media', reload));
  gulp.watch(['images/**/*'], gulp.series('images', reload));
  gulp.watch(['content/**/*', 'gulpfile.js'], gulp.series('hugo:dev', reload));
  gulp.watch(['src/**/*', '!src/scss/**/*.scss', '!src/images/**/*'], gulp.series('hugo:dev', reload));
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
