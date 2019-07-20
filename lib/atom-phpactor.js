'use babel';

import AtomPhpactorView from './atom-phpactor-view';
import phpactor from './atom-phpactor-wrapper';
import { CompositeDisposable } from 'atom';
import autoCompleteProvider from './auto-complete-provider';

export default {

  subscriptions: null,

  completionProvider() {
    return autoCompleteProvider;
  },

  activate(state) {
    atom.config.observe(
      'atom-phpactor.path',
      this.subscribeForPhpActorPath
    );
  },

  subscribeForPhpActorPath(path) {
    if (this.subscriptions) {
      this.subscriptions.dispose();
    }

    if (!phpactor.validatePath(path)) {
      console.log('bo')
      atom.notifications.addFatalError('PHP Actor not found at path supplied');
      return;
    }

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'atom-phpactor:goto-definition': () => phpactor.goToDefinition(path),
      'atom-phpactor:copy-class': () => phpactor.copyClass(path),
      'atom-phpactor:move-class': () => phpactor.moveClass(path),
      'atom-phpactor:transform': () => phpactor.transform(path),
      'atom-phpactor:class-new': () => phpactor.classNew(path),
      'atom-phpactor:class-inflect': () => phpactor.classInflect(path),
      'atom-phpactor:references': () => phpactor.references(path),
      'atom-phpactor:extract-constant': () => phpactor.extractConstant(path),
      'atom-phpactor:generate-accessor': () => phpactor.generateAccessor(path),
      'atom-phpactor:context-menu': () => phpactor.contextMenu(path),
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  config: {
    path: {
      type: 'string',
      default: ''
    }
  }
};
