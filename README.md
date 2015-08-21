# gulp-module-bundle  [![npm version](https://img.shields.io/npm/v/gulp-module-bundle.svg)](https://www.npmjs.com/package/gulp-module-bundle)

es6模块捆绑器

## Install

npm install --save-dev gulp-module-bundle


## Example

```js
var gulp = require('gulp');
var bundle = require('gulp-module-bundle');
gulp.task('bundle', function () {
    return gulp.src(src)
        .pipe(bundle())
        .pipe(gulp.dest(dest));
});
```

License
-------

MIT