const { promisify } = require('util');
const { spawn } = require('child_process');
const { Readable } = require('stream');

function testForPhpActor(path) {
  return new Promise((resolve, reject) => {
    const cmd = spawn(path, {
      shell: '/bin/bash'
    });
    let result = '';
    cmd.stdout.on('data', function (data) {
      result += data.toString();
    });
    cmd.on('close', function () {
      if (result.split('\n')[0].toLowerCase().indexOf('phpactor', 0) === -1) {
        reject('Phpactor not found');
      } else {
        resolve(result);
      }
    });
    cmd.on('error', function (err) {
      reject(err);
    });
    cmd.stdin.end();
  });
}

function rpcPhpActor(path, workingDir, command) {
  if (command.action === 'return') {
    return command.parameters.value;
  }
  return new Promise((resolve, reject) => {
    const sh = path + ' rpc --working-dir=\'' + workingDir + '\'';
    const cmd = spawn(sh, {
      shell: '/bin/bash'
    });
    cmd.stdin.write(JSON.stringify(command));
    let result = '';
    cmd.stdout.on('data', function (data) {
      result += data.toString();
    })
    cmd.on('close', function () {
      resolve(JSON.parse(result));
    });
    cmd.on('error', function (err) {
      reject(err);
    });
    cmd.stdin.end();
  });
}

module.exports = {
  validatePath(path) {
    return testForPhpActor(path);
  },
  complete(path, workingDir, source, offset) {
    const command = {
      action: 'complete',
      parameters: {
        source,
        offset,
        type: 'php'
      }
    };
    return rpcPhpActor(path, workingDir, command);
  },
  goToDefinition(path, workingDir, source, offset, currentFilePath) {
    const command = {
      action: 'goto_definition',
      parameters: {
        source,
        offset,
        path: currentFilePath
      }
    };
    return rpcPhpActor(path, workingDir, command);
  },
  copyClass(path, workingDir, sourcePath, targetPath) {
    const command = {
      action: 'copy_class',
      parameters: {
        source_path: sourcePath,
        dest_path: targetPath
      }
    };
    return rpcPhpActor(path, workingDir, command);
  },
  moveClass(path, workingDir, sourcePath, targetPath) {
    const command = {
      action: 'move_class',
      parameters: {
        source_path: sourcePath,
        dest_path: targetPath
      }
    };
    return rpcPhpActor(path, workingDir, command);
  },
  transform(path, workingDir, source, currentFilePath) {
    const command = {
      action: 'transform',
      parameters: {
        source,
        path: currentFilePath
      }
    };
    return rpcPhpActor(path, workingDir, command);
  },
  classNew(path, workingDir, sourcePath, targetPath) {
    const command = {
      action: 'class_new',
      parameters: {
        current_path: sourcePath,
        new_path: targetPath
      }
    };
    return rpcPhpActor(path, workingDir, command);
  },
  classInflect(path, workingDir, sourcePath, targetPath) {
    const command = {
      action: 'class_inflect',
      parameters: {
        current_path: sourcePath,
        new_path: targetPath
      }
    };
    return rpcPhpActor(path, workingDir, command);
  },
  references(path, workingDir, source, offset, filePath) {
    const command = {
      action: 'references',
      parameters: {
        source,
        offset,
        path: filePath
      }
    };
    return rpcPhpActor(path, workingDir, command);
  },
  extractConstant(path, workingDir, filePath, source, offset, constantName) {
    const command = {
      action: 'extract_constant',
      parameters: {
        source,
        offset,
        path: filePath
      }
    };
    if (constantName !== undefined) {
      command.parameters.constant_name = constantName;
    }
    return rpcPhpActor(path, workingDir, command);
  },
  generateAccessor(path, workingDir, filePath, source, offset) {
    const command = {
      action: 'generate_accessor',
      parameters: {
        source,
        offset,
        path: filePath
      }
    };
    return rpcPhpActor(path, workingDir, command);
  },
  contextMenu(path, workingDir, source, offset, currentPath) {
    const command = {
      action: 'context_menu',
      parameters: {
        source,
        offset,
        current_path: currentPath
      }
    };
    return rpcPhpActor(path, workingDir, command);
  },
  navigate(path, workingDir, sourcePath) {
    const command = {
      action: 'navigate',
      parameters: {
        source_path: sourcePath
      }
    };
    return rpcPhpActor(path, workingDir, command);
  },
  execute(path, workingDir, command) {
    return rpcPhpActor(path, workingDir, command);
  }
};
