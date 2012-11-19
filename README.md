Mason: the simplest possible thing for modular javscript projects.

Mason is a command line utility for copying ("installing") local javascript modules, where "module" is either an NPM package or Bower component.  Mason extracts the published files and copies them to the destination in your application.  It is essentially a very lightweight local Bower and is intended to harness existing NPM and Bower infrastructure.

Installation
============

``npm install mason``

Help
====

``mason --help``

Command line
============

``mason install [--flatten] [--dest d] dir1 dir2``

Grunt
=====

```
  mason: {
    paths: '../shared',
    dest: 'app/js/components',
    flatten: true
  }

...

  grunt.loadNpmTasks('mason')
```

``grunt mason:install``
