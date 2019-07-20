'use babel';

import { View } from 'space-pen';
import { TextEditorView } from 'atom-space-pen-views';
import phpactor from './atom-phpactor-wrapper';

const ESCAPE_KEY = 27;
const ENTER_KEY = 13;

class InputTextView extends View {
  constructor(path, callback, name, label) {
    const current = atom.workspace.getActiveTextEditor();
    const editor = new TextEditorView({
      mini: true,
      placeholderText: label
    });
    editor.keydown((e) => {
      if (e.which === ESCAPE_KEY) {
        this.panel.destroy();
      } else if (e.which === ENTER_KEY) {
        this.panel.destroy();
        phpactor.inputCallback(
          path,
          callback,
          name,
          editor.getModel().getText()
        );
      }
      current.element.focus();
    });
    super(path, callback, name, label, editor);
  }

  initialize(path, callback, name, label, editor) {
    this.addClass('overlay-from-top');
    this.panel = atom.workspace.addModalPanel({
      item: this
    });
    this.panel.show();
    editor.focus();
  }

  content(path, callback, name, label, editor) {
    return this.div(() => {
      const response = this.subview('response', editor);
      return response;
    });
  }
};

InputTextView.content = InputTextView.prototype.content;
InputTextView.initialize = InputTextView.prototype.initialize;
export default InputTextView;
