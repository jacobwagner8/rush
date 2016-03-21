module.exports = grunt => {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    sass: {
      dist: {
        files: [{
          expand: true,
          cwd: './views/scss',
          src: '*.scss',
          dest: './dist/css',
          ext: '.css'
        }]
      }
    },
    copy: {
      bootstrap: {
        expand: true,
        cwd: './node_modules/bootstrap/dist',
        src: '**',
        dest: './dist'
      },
      jquery: {
        expand: true,
        cwd: './node_modules/jquery/dist',
        src: '**',
        dest: './dist/js'
      },
      autosize: {
        expand: true,
        cwd: './node_modules/autosize/dist',
        src: '**',
        dest: './dist/js'
      }
      // TODO: webcamjs
    }
  });

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-sass');

  grunt.registerTask('default', ['sass', 'copy']);
};