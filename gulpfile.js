var gulp = require('gulp');
var $    = require('gulp-load-plugins')();

var sassPaths = [
  'bower_components/normalize.scss/sass',
  'bower_components/foundation-sites/scss'
];

gulp.task('build', ['scss', 'media']);

gulp.task('scss', function() {
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
});

gulp.task('media', function() {
  return gulp.src('media/**/*')
    .pipe(gulp.dest('public/media'));
});

gulp.task('default', ['build'], function() {
  gulp.watch(['src/scss/**/*.scss'], ['scss']);
  gulp.watch(['media/**/*'], ['media']);
});
