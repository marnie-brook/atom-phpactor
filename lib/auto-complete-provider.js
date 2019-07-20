'use babel';

import phpactor from './atom-phpactor-wrapper';

class AutoCompleteProvider {
  constructor() {
    this.selector = '.source.php';
    this.disableForSelector = '.source.php .comment';
    this.inclusionPriority = 100;
    this.excludeLowerPriority = true;
    this.suggestionPriority = 100;
    this.filterSuggestions = true;
    this._typeRegex = /:\s?[A-Za-z]*$/;
    this._argumentRegex = /\$[A-Za-z]*/g
  }

  getSuggestions({ editor, bufferPosition, scopeDescriptor, prefix, activatedManually}) {
    return new Promise((r) => r(this._buildSuggestions()));
  }

  _buildSuggestions() {
    return phpactor.complete(atom.config.get('atom-phpactor.path'))
      .then((resp) => resp.parameters.value.suggestions.map((s) => this._inflateSuggestion(s)))
      .catch((err) => {
        console.error(err);
        atom.notifications.addError(err);
        return [];
      });
  }

  _inflateSuggestion(suggestion) {
    let inflated =  {
      snippet: this._generateSnippet(suggestion),
      displayText: suggestion.name,
      type: suggestion.type,
      leftLabel: this._getSuggestionType(suggestion),
    };
    return inflated;
  }

  _generateSnippet(suggestion) {
    if (suggestion.type !== 'method') {
      return suggestion.name;
    }
    const snippetParts = this._getArgumentsForSuggestion(suggestion);
    return suggestion.name + '(' + snippetParts.map((item, i) => {
      return '${' + (i + 1) + ':' + item + '}';
    }, '').join(', ') + ')';
  }

  _getArgumentsForSuggestion(suggestion) {
    const match = suggestion.info.match(this._argumentRegex);
    if (match === null) {
      return [];
    }
    return match;
  }

  _getSuggestionType(suggestion) {
    const match = suggestion.info.match(this._typeRegex);
    if (match === null) {
      return '';
    }
    return match[0].substring(1).trim();
  }
};
export default new AutoCompleteProvider();
