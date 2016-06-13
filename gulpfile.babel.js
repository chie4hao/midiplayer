/**
 * Created by chie on 2016/6/13.
 */

import gulp from "gulp";
import browserify from "browserify";
import source from "vinyl-source-stream";
import gulpLoadPlugins from "gulp-load-plugins";
import buffer from "vinyl-buffer";

const $ = gulpLoadPlugins();

gulp.task('javascript', ()=> {
    // 在一个基础的 task 中创建一个 browserify 实例
    var b = browserify({
        entries: './main.js',
        debug: true
    });

    return b.bundle()
        .pipe(source('midi.min.js'))
        .pipe(buffer())
        .pipe($.sourcemaps.init({loadMaps: true}))
        .pipe($.babel())
        .pipe($.uglify())
        .pipe($.sourcemaps.write('./'))
        .pipe(gulp.dest('./build/'));
});

gulp.task('default',['javascript'],()=>
    gulp.watch(['js/**/*.js'],['javascript'])
)