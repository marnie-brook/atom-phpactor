'use babel';

import { SelectListView } from 'atom-space-pen-views';
import phpactor from './atom-phpactor-wrapper';

class InputCallbackView extends SelectListView {

  constructor(path, callback, name, choices) {
    super();
    console.log(`Name ${name}`);
    this.path = path;
    this.callback = callback;
    this.name = name;
    this.choices = choices;
    this.setItems(choices);
  }

  initialize() {
    super.initialize();
    this.addClass('overlay-from-top');
    this.panel = atom.workspace.addModalPanel({
      item: this
    });
    this.panel.show();
    this.populateList();
    this.focusFilterEditor();
  }

  viewForItem(item) {
    return `<li>${item}</li>`
  }

  confirmed(item) {
    this.panel.destroy();
    switch (item) {
      case 'find_references':
        phpactor.references(this.path);
        break;
      case 'goto_definition':
        phpactor.goToDefinition(this.path);
        break;
      case 'transform_file':
        phpactor.transform(this.path);
        break;
      default:
        console.log(`Using default case for ${item}`);
        phpactor.inputCallback(
          this.path,
          this.callback,
          this.name,
          item
        );
    }
  }

  cancelled(item) {
    this.panel.destroy();
  }
};
export default InputCallbackView;
