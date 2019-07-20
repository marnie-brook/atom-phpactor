'use babel';

// SOURCE
// https://phpactor.github.io/phpactor/rpc.html

import AtomPhpactorView from './atom-phpactor-view';
import phpactor from './js-phpactor';
import { CompositeDisposable } from 'atom';
import InputCallbackView from './input-callback-view';
import InputTextView from './input-text-view';
import { unlink } from 'fs';

function convertCursorPositionToOffset(textEditor) {
  let offset = 0;
  let point = textEditor.getCursorBufferPosition();
  let lines = textEditor.getText().split('\n');
  for (let i = 0; i < point.row; i++) {
    offset += lines[i].length + 1;
  }
  offset += point.column;
  return offset;
}

function getTextEditorText(editor) {
  return editor.getText();
}

function reportError(err) {
  console.error(err);
  if (typeof err === 'string') {
    atom.notifications.addError(err);
  } else {
    atom.notifications.addError('An error has occured, more information is available in the console');
  }
}

export default {
  _evaluateResponse(path, response) {
    const action = response.action;
    switch (action) {
      case 'close_file':
        atom.workspace.getActiveTextEditor().destroy();
        break;
      case 'return':
        console.error('Action ' + action + ' not implemented yet');
        atom.notifications.addError('Action ' + action + ' not implemented yet');
        break;
      case 'echo':
        atom.notifications.addInfo(response.parameters.message);
        break;
      case 'error':
        console.error(response.parameters.message);
        atom.notifications.addError(response.parameters.message);
        break;
      case 'collection':
        for (const action of response.parameters.actions) {
          this._evaluateResponse(
            path,
            {
              action: action.name,
              parameters: action.parameters
            }
          );
        }
        break;
      case 'open_file':
        atom.workspace.open(response.parameters.path)
          .then(
            () => this._moveToOffset(response.parameters.offset + 1 )
          );
        break;
      case 'update_file_source':
        const editor = atom.workspace.getActiveTextEditor();
        let lines = editor.getText().split('\n');
        const edits = response.parameters.edits;
        for (const index in response.parameters.edits) {
          const edit = response.parameters.edits[index];
          const start = edit.start;
          const end = edit.end;
          const line = lines[start.line];
          const column = line[start.character];
          const linesToDelete = end.line - start.line;
          if (linesToDelete > 0) {
            lines.splice(start.line, linesToDelete);
          }
          if (edit.text === '\n') {
            lines.splice(start.line, 0, '');
          } else {
            lines.splice(start.line, 0, ...edit.text.split('\n'));
          }
        }
        editor.setText(
          lines.join('\n')
        );
        break;
      case 'file_references':
        const references = response.parameters.file_references.reduce((acc, x) => {
          for (const reference of x.references) {
            acc.push(
              `${x.file}|${reference.line_no}:${reference.col_no}|${reference.line}`
            );
          }
          return acc;
        }, [])
        const filePath = '/tmp/atom-phpactor-references';
        atom.workspace.open(filePath, {
          split: 'right'
        }).then(
          () => {
            atom.workspace.getActiveTextEditor().setText(references.join("\n"));
            atom.workspace.getActiveTextEditor().save();
          }
        );
        break;
      case 'input_callback':
        if (response.parameters.inputs[0].parameters.choices) {
          const choices = Object.keys(response.parameters.inputs[0].parameters.choices);
          const callbackListView = new InputCallbackView(
            path,
            response.parameters.callback,
            response.parameters.inputs[0].name,
            choices
          );
        } else if (response.parameters.inputs[0].type === "text") {
          const inputView = new InputTextView(
            path,
            response.parameters.callback,
            response.parameters.inputs[0].name,
            response.parameters.inputs[0].parameters.label
          );
        } else {
          console.error("Unsure how to handle return 'input_callback'");
          atom.notifications.addError("Unsure how to handle return 'input_callback'");
        }
        break;
      case 'information':
        atom.notifications.addInfo(
          response.parameters.information
        );
        break;
      case 'replace_file_source':
        atom.workspace.getActiveTextEditor().setText(response.parameters.source);
        break;
      default:
        console.error(`Unknown Phpactor action supplied action: ${action}`);
        atom.notifications.addError(`Unknown Phpactor action supplied action: ${action}`);
    }
  },

  _moveToOffset(offset) {
    const lines = atom.workspace.getActiveTextEditor().getText().split('\n');
    let index = 0;
    let line = 0;
    for (var i = 0; i < lines.length; i++) {
      let lineLength = lines[i].length + 1;
      if (index + lineLength > offset) {
        line = i;
        break;
      }
      index += lineLength;
    }
    const column = offset - index;
    atom.workspace.getActiveTextEditor().setCursorBufferPosition([line, column > 0 ? column - 1 : 1]);
  },

  validatePath(path) {
    return phpactor.validatePath(path);
  },

  complete(path) {
    const editor = atom.workspace.getActiveTextEditor();
    return phpactor.complete(
      path,
      atom.project.getPaths()[0],
      getTextEditorText(editor),
      convertCursorPositionToOffset(editor)
    );
  },

  goToDefinition(path) {
    const editor = atom.workspace.getActiveTextEditor();
    phpactor.goToDefinition(
      path,
      atom.project.getPaths()[0],
      getTextEditorText(editor),
      convertCursorPositionToOffset(editor),
      editor.getPath()
    ).then((response) => this._evaluateResponse(path, response))
      .catch((err) => reportError(err));
  },

  copyClass(path) {
    const editor = atom.workspace.getActiveTextEditor();
    phpactor.copyClass(
      path,
      atom.project.getPaths()[0],
      editor.getPath(),
      editor.getPath() + '2'
    ).then((response) => this._evaluateResponse(path, response))
      .catch((err) => reportError(err));
  },

  moveClass(path) {
    const editor = atom.workspace.getActiveTextEditor();
    phpactor.moveClass(
      path,
      atom.project.getPaths()[0],
      editor.getPath(),
      editor.getPath() + '2'
    ).then((response) => this._evaluateResponse(path, response))
      .catch((err) => reportError(err));
  },

  transform(path) {
    const editor = atom.workspace.getActiveTextEditor();
    phpactor.transform(
      path,
      atom.project.getPaths()[0],
      getTextEditorText(editor),
      editor.getPath()
    ).then((response) => this._evaluateResponse(path, response))
      .catch((err) => reportError(err));
  },

  classNew(path) {
    const editor = atom.workspace.getActiveTextEditor();
    phpactor.classNew(
      path,
      atom.project.getPaths()[0],
      editor.getPath(),
      editor.getPath() + '2',
    ).then((response) => this._evaluateResponse(path, response))
      .catch((err) => reportError(err));
  },

  clasInflect(path) {
    const editor = atom.workspace.getActiveTextEditor();
    phpactor.classInflect(
      path,
      atom.project.getPaths()[0],
      editor.getPath(),
      editor.getPath() + '2',
    ).then((response) => this._evaluateResponse(path, response))
      .catch((err) => reportError(err));
  },

  references(path) {
    const editor = atom.workspace.getActiveTextEditor();
    phpactor.references(
      path,
      atom.project.getPaths()[0],
      getTextEditorText(editor),
      convertCursorPositionToOffset(editor),
      editor.getPath()
    ).then((response) => this._evaluateResponse(path, response))
      .catch((err) => reportError(err));
  },

  extractConstant(path) {
    const editor = atom.workspace.getActiveTextEditor();
    phpactor.extractConstant(
      path,
      atom.project.getPaths()[0],
      editor.getPath(),
      getTextEditorText(editor),
      convertCursorPositionToOffset(editor)
    ).then((response) => this._evaluateResponse(path, response))
      .catch((err) => reportError(err));
  },

  generateAccessor(path) {
    const editor = atom.workspace.getActiveTextEditor();
    phpactor.generateAccessor(
      path,
      atom.project.getPaths()[0],
      editor.getPath(),
      getTextEditorText(editor),
      convertCursorPositionToOffset(editor)
    ).then((response) => this._evaluateResponse(path, response))
      .catch((err) => reportError(err));
  },

  contextMenu(path) {
    const editor = atom.workspace.getActiveTextEditor();
    phpactor.contextMenu(
      path,
      atom.project.getPaths()[0],
      getTextEditorText(editor),
      convertCursorPositionToOffset(editor),
      editor.getPath()
    ).then((response) => this._evaluateResponse(path, response))
      .catch((err) => reportError(err));
  },

  inputCallback(path, callback, name, value) {
    callback.parameters[name] = value;
    phpactor.execute(
      path,
      atom.project.getPaths()[0],
      callback
    ).then((response) => this._evaluateResponse(path, response))
      .catch((err) => reportError(err))
  }
}
