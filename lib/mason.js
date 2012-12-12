var path = require('path'),
    fs = require('fs'),
    mkdirp = require('mkdirp').sync,
    fstream_npm = require('fstream-npm'),
    colors = require('colors'),
    FORMATS = {
      'component.json': iterate_bower_files,
      'package.json': iterate_npm_files
    };

// async can bite me
function Join(cb, ctx) {
  var signals = {}, results = [];
  this.add = function(id, fun) {
    var wrapper = function() {
      delete signals[id];
      results.push(fun ? fun.apply(ctx, arguments) : id);
      if (Object.keys(signals).length === 0 && cb) {
        cb(results);
      }
    };
    signals[id] = wrapper;
    return wrapper;
  };
}

function copy(src, dest, done, log_err) {
  var out, error_msg = "Component file not found: " + src,
      local_log_err = log_err || console.log;
  if (!is_file(src)) {
    local_log_err(error_msg.red);
    if (log_err) {
      done();
      return;
    } else {
      throw new Error(error_msg);
    }
  }

  mkdirp(path.dirname(dest));
  out = fs.createWriteStream(dest);
  out.on('open', function(fd) {
    fs.createReadStream(src).pipe(out);
  });
  out.on('close', done);
}

function is_file(path) {
  return fs.existsSync(path) && fs.statSync(path).isFile();
}

function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function iterate_package_files(dest, pkg_path, cb) {
  var keys = Object.keys(FORMATS),
      pkg_path_is_file = is_file(pkg_path),
      pkg_dir = pkg_path,
      error_msg = "No valid package manifests found in " + pkg_dir + ": " + keys.join(", ");

  if (pkg_path_is_file) {
    pkg_dir = path.dirname(pkg_path);
  }

  for (var i = 0; i < keys.length; i++) {
    var func = FORMATS[keys[i]];
    if (pkg_path_is_file) {
      if (endsWith(pkg_path, keys[i])) {
        func(dest, pkg_dir, path.basename(pkg_path), cb);
        return;
      }
    } else if (is_file(path.join(pkg_dir, keys[i]))) {
      func(dest, pkg_dir, keys[i], cb);
      return;
    }
  }

  console.error(error_msg.red);
  throw new Error(error_msg);
}

function iterate_npm_files(dest, pkg_dir, pkg_json, cb) {
  var package_json = path.join(pkg_dir, pkg_json);
  fstream_npm({ path: pkg_dir }).on("child", function(pkg_file) {
    // skip the package.json
    if (package_json === pkg_file.props.path) return;
    cb(pkg_file.props.path, dest);
  });
}

function iterate_bower_files(dest, pkg_dir, pkg_json, cb) {
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
}

function package_dir_path(abs_path) {
  return is_file(abs_path) ? path.dirname(abs_path) : abs_path; 
}

function install_path(dest, pkg_path, options, done, log_err) {
  var abs_src = path.resolve(pkg_path),
      abs_dir = package_dir_path(abs_src),
      abs_parent = path.dirname(abs_dir),
      pkg_name = path.basename(abs_dir),
      join = new Join(done);

  if (!options) options = {}; 

  console.log("Installing " + pkg_name.green + " to " + path.join(dest, pkg_name).blue);
  iterate_package_files(dest, abs_src, function(pkg_file) {
    var rel_path = pkg_file.substring(abs_parent.length + 1),
        tgt_path = options.flatten ? path.join(pkg_name, path.basename(rel_path)) : rel_path,
        file_dest = path.join(dest, tgt_path);
    console.log('Copying ' + pkg_file.green + " -> ".yellow + file_dest.blue);
    copy(pkg_file, file_dest, join.add(pkg_file), log_err);
  });
}

function install(paths, dest, options, done, log_err) {
  var abs_dest = path.resolve(dest),
      join = new Join(done);
  console.log("Installing components to: " + abs_dest.blue);

  paths.forEach(function(pkg_path) {
    install_path(abs_dest, pkg_path, options, join.add(pkg_path), log_err);
  });
}

exports.install = install;
