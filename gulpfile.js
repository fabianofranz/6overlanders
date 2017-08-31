var gulp = require('gulp');
var $    = require('gulp-load-plugins')();

var sassPaths = [
  'bower_components/normalize.scss/sass',
  'bower_components/foundation-sites/scss'
];

gulp.task('sass', function() {
  return gulp.src('src/scss/app.scss')
    .pipe($.sass({
      includePaths: sassPaths,
      outputStyle: 'compressed' // if css compressed **file size**
    })
      .on('error', $.sass.logError))
    .pipe($.autoprefixer({
      browsers: ['last 2 versions', 'ie >= 9']
    }))
    .pipe(gulp.dest('src/static/css'));
});

gulp.task('default', ['sass'], function() {
  gulp.watch(['src/scss/**/*.scss'], ['sass']);
});
