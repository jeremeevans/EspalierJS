var assign = require("object-assign");
var config = require("../config/webpack")("prod");
var gulp = require("gulp");
var webpack = require("webpack");
var logger = require("../lib/compileLogger");

gulp.task("webpack:prod", function (callback) {
    var built = false;

    webpack(config).watch(200, function (err, stats) {
        logger(err, stats);
        // On the initial compile, let gulp know the task is done
        if (!built) {
            built = true;
            callback();
        }
    });
});