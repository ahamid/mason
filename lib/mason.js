var path = require('path'),
    fs = require('fs'),
    mkdirp = require('mkdirp').sync,
    fstream_npm = require('fstream-npm'),
    colors = require('colors'),
    FORMATS = {
      'component.json': iterate_bower_files,
      'package.json': iterate_npm_files
    };

function copy(src, dest) {
  mkdirp(path.dirname(dest));
  fs.createWriteStream(dest).on('open', function(fd) {
    fs.createReadStream(src).pipe(this);
  });
}

function is_file(path) {
  return fs.existsSync(path) && fs.statSync(path).isFile();
}

function iterate_package_files(dest, dir, cb, done) {
  var keys = Object.keys(FORMATS),
      error_msg = "No valid package manifests found in " + dir + ": " + keys.join(", ");

  for (var i = 0; i < keys.length; i++) {
    if (is_file(path.join(dir, keys[i]))) {
      FORMATS[keys[i]](dest, dir, keys[i], cb, done);
      return;
    }
  }

  console.error(error_msg.red);
  throw new Error(error_msg);
}

function iterate_npm_files(dest, pkg_dir, pkg_json, cb, done) {
  var package_json = path.join(pkg_dir, pkg_json);
  fstream_npm({ path: pkg_dir }).on("child", function(pkg_file) {
    // skip the package.json
    if (package_json === pkg_file.props.path) return;
    cb(pkg_file.props.path, dest);
  }).on('end', done);
}

function iterate_bower_files(dest, pkg_dir, pkg_json, cb, done) {
  var component = JSON.parse(fs.readFileSync(path.join(pkg_dir, pkg_json))),
      files = [];
  if (typeof component.main === 'string') {
    files.push(component.main);
  } else {
    files = component.main;
  }
  files.forEach(function(pkg_file) {
    cb(path.join(pkg_dir, pkg_file));
  });
  done();
}

function install_dir(dest, dir, options, done) {
  var abs_src = path.resolve(dir),
      abs_parent = path.dirname(abs_src),
      pkg_name = path.basename(abs_src);

  if (!options) options = {}; 

  console.log("Installing " + pkg_name.green + " to " + path.join(dest, pkg_name).blue);
  iterate_package_files(dest, abs_src, function(pkg_file) {
    var rel_path = pkg_file.substring(abs_parent.length + 1),
        tgt_path = options.flatten ? path.join(pkg_name, path.basename(rel_path)) : rel_path,
        file_dest = path.join(dest, tgt_path);
    console.log('Copying ' + pkg_file.green + " -> ".yellow + file_dest.blue);
    copy(pkg_file, file_dest);
  }, done);
}

function install(dirs, dest, options, done) {
  var abs_dest = path.resolve(dest);
  console.log("Installing components to: " + abs_dest.blue);

  dirs.forEach(function(dir) {
    install_dir(abs_dest, dir, options, function() { if (done) done(); });
  });
}

exports.install = install;
