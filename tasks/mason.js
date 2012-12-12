module.exports = function(grunt) {

  // Please see the grunt documentation for more information regarding task and
  // helper creation: https://github.com/cowboy/grunt/blob/master/docs/toc.md

  // ==========================================================================
  // TASKS
  // ==========================================================================

  grunt.registerMultiTask('mason', 'the simplest possible thing for modular javascript projects', function(cmd) {
    var command, paths, config;

    // requiresConfig is just broken.
    // namespace 'get' stops as soon as it hits a non-object, returning invalid, but non-undefined result
    //this.requiresConfig('mason.' + this.target + '.paths');
    config = this.data || {};
    if (!config.paths) {
      throw grunt.task.taskError('Required config property "paths" missing.');
    }

    if (!cmd) cmd = 'install';

    command = require('../lib/mason.js')[cmd];
    if (!command) {
      grunt.log.error('Invalid mason command: ' + cmd);
      return false;
    }

    paths = config.paths;
    if (typeof paths === 'string') {
      paths = [ paths ];
    }
    var done = this.async();
    command(paths, config.dest || 'components', config, done, grunt.fail.warn);
  });
};
