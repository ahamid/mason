module.exports = function(grunt) {

  // Please see the grunt documentation for more information regarding task and
  // helper creation: https://github.com/cowboy/grunt/blob/master/docs/toc.md

  // ==========================================================================
  // TASKS
  // ==========================================================================

  grunt.registerTask('mason', 'the simplest possible thing for modular javascript projects', function(cmd) {
    var command, paths, config;

    this.requiresConfig('mason.paths');

    if (!cmd) cmd = 'install';

    command = require('../lib/mason.js')[cmd];
    if (!command) {
      grunt.log.error('Invalid mason command: ' + cmd);
      return false;
    }

    config = grunt.config.get('mason') || {};
    paths = config.paths;
    if (typeof paths === 'string') {
      paths = [ paths ];
    }
    var done = this.async();
    command(paths, config.dest || 'components', config, done);
  });
};
