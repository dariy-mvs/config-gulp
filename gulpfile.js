const projectFolder = "dist";
const sourceFolder = "#src";
const path = {
  build: {
    html: `${projectFolder}/`,
    css: `${projectFolder}/css/`,
    js: `${projectFolder}/js/`,
    img: `${projectFolder}/img/`,
    fonts: `${projectFolder}/fonts/`,
    slick: `${sourceFolder}/slick/**/*`,
    rangeSlick: `${sourceFolder}/ion.rangeSlider-master/**/*`
  },
  src: {
    html: [ `${sourceFolder}/*.html`, `!${sourceFolder}/_*.html` ],
    css: `${sourceFolder}/scss/style.scss`,
    js: `${sourceFolder}/js/**/*.js`,
    img: `${sourceFolder}/img/**/*.{jpg,img,webp,svg,gif,ico,jpeg,png}`,
    fonts: `${sourceFolder}/fonts/*.{eot,svg,ttf,woff,woff2}`,
    fonts2fonts: `${sourceFolder}/fonts/*`,
    slick: `${sourceFolder}/slick/**/*`,
    rangeSlick: `${sourceFolder}/ion.rangeSlider-master/**/*`
  },
  watch: {
    html: `${sourceFolder}/**/*.html`,
    css: `${sourceFolder}/scss/**/*.scss`,
    js: `${sourceFolder}/js/**/*.js`,
    img: `${sourceFolder}/img/**/*.{jpg,img,webp,svg,gif,ico,jpeg,png}`,
    slick: `${sourceFolder}/slick/**/*`,
    rangeSlick: `${sourceFolder}/ion.rangeSlider-master/**/*`
  },
  clean: `./${projectFolder}/`
};

const { src, dest } = require( "gulp" );
const gulp = require( "gulp" );
const browsersync = require( "browser-sync" ).create();
const fileinclude = require( "gulp-file-include" );
const del = require( "del" );
const scss = require( "gulp-sass" )(require('sass'));
const autoprefixer = require( "gulp-autoprefixer" );
const groupMedia = require( "gulp-group-css-media-queries" );
const cleanCss = require( "gulp-clean-css" );
const rename = require( "gulp-rename" );
const babel = require( "gulp-babel" );
const imagemin = require( "gulp-imagemin" );
const ttf2woff = require( "gulp-ttf2woff" );
const ttf2woff2 = require( "gulp-ttf2woff2" );
const fonter = require( "gulp-fonter" ); // из-за 2 \\ он неправильно меняет название шрифта. нужно в node modules/gulp-fonter/index.js изменить \\ на \f
const fs = require( "fs" );
const htmlbeautify = require( "gulp-html-beautify" );

function browserSync( params ) {
  browsersync.init( {
    server: {
      baseDir: `./${projectFolder}/`
    },
    reloadDelay: 100,
    open: true,
    notify: true,
    port: 3000
  } );
}
const options = {
  indent_size: 2,
  indent_char: " "
};

function html() {
  return src( path.src.html )
    .pipe( fileinclude() )
    .pipe( htmlbeautify( options ) )
    .pipe( dest( path.build.html ) )
    .pipe( browsersync.stream() );
}

function css() {
  return src( path.src.css )
    .pipe(
      scss( {
        outputStyle: "expanded"
      } )
    )
    .pipe(
      groupMedia()
    )
    .pipe( autoprefixer( {
      overrideBrowsersList: [ "last 15 versions", "> 1%", "ie 9" ],
      cascade: true
    } ) )
    .pipe( dest( path.build.css ) )
    .pipe( cleanCss() )
    .pipe( rename( {
      extname: ".min.css"
    } ) )
    .pipe( dest( path.build.css ) )
    .pipe( browsersync.stream() );
}

function js() {
  return src( path.src.js )
    .pipe( fileinclude() )
    .pipe( dest( path.build.js ) )
    .pipe( browsersync.stream( path.build.js ) );
}

function images() {
  return src( path.src.img )
    .pipe( dest( path.build.img ) )
    .pipe( src( path.src.img ) )
    .pipe( imagemin( {
      progressive: true,
      optimizationLevel: 3,
      svgoPlugins: [ { removeViewBox: true } ],
      interlaced: true
    } ) )
    .pipe( dest( path.build.img ) )
    .pipe( browsersync.stream() );
}

function fonts() {
  src( path.src.fonts )
    .pipe( ttf2woff() )
    .pipe( dest( path.build.fonts ) );

  return src( path.src.fonts )
    .pipe( ttf2woff2() )
    .pipe( dest( path.build.fonts ) );
}


function watchFiles( params ) {
  gulp.watch( [ path.watch.html ], html );
  gulp.watch( [ path.watch.css ], css );
  gulp.watch( [ path.watch.js ], js );
  gulp.watch( [ path.watch.img ], images );
}

function clean() {
  return del( path.clean );
}

function fontsStyle( params ) {
  const file_content = fs.readFileSync( `${sourceFolder}/scss/fonts.scss` );
  if ( file_content == "" ) {
    fs.writeFile( `${sourceFolder}/scss/fonts.scss`, "", cb );
    return fs.readdir( path.build.fonts, ( err, items ) => {
      if ( items ) {
        let cFontname;
        for ( let i = 0; i < items.length; i++ ) {
          let fontname = items[ i ].split( "." );
          fontname = fontname[ 0 ];
          if ( cFontname != fontname ) {
            fs.appendFile( `${sourceFolder}/scss/fonts.scss`, `@include font("${fontname}", "${fontname}", "400", "normal");\r\n`, cb );
          }
          cFontname = fontname;
        }
      }
    } );
  }
}

function cb() { }

gulp.task( "otf2ttf", () => src( [ `${sourceFolder}/fonts/*.otf` ] )
  .pipe( fonter( {
    formats: [ "ttf" ]
  } ) )
  .pipe( dest( path.src.fonts2fonts ) ) );

const build = gulp.series( clean, gulp.parallel( js, html, css, images, fonts ), fontsStyle );
const watch = gulp.parallel( build, watchFiles, browserSync );

exports.fontsStyle = fontsStyle;
exports.images = images;
exports.fonts = fonts;
exports.build = build;
exports.html = html;
exports.js = js;
exports.css = css;
exports.watch = watch;
exports.default = watch;
