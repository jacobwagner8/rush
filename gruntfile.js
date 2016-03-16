module.exports = grunt => {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    copy: {
      bootstrap: {
        expand: true,
        cwd: './node_modules/bootstrap/dist/',
        src: ['css/bootstrap.min.css', 'js/bootstrap.min.js'],
        dest: './dist/'
      },
      jquery: {
        expand: true,
        cwd: './node_modules/jquery/dist/',
        src: 'jquery.slim.min.js',
        dest: './dist/js/'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.registerTask('default', ['copy']);
};