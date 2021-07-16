import monacoLoader from '@monaco-editor/loader';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';

// Object.defineProperty(window, 'require', {
//   configurable: true,
//   // writable: true,
//   get() {
//     return undefined;
//   },
//   set(require) {
//     debugger;
//     // removes our descriptor hack
//     delete (window as any).require;
//     // console.log({ value });
//     // localRequire = value;
//     (window as any).require = function (...args: any[]) {
//       debugger;
//       console.log(args);
//       return require(...args);
//     };
//     (window as any).require.config = require.config;
//   },
// });

/*

	public async resolveCompletionItem(
		item: languages.CompletionItem,
		token: CancellationToken
	): Promise<languages.CompletionItem> {
		const myItem = <MyCompletionItem>item;
		const resource = myItem.uri;
		const position = myItem.position;
		const offset = myItem.offset;

		const worker = await this._worker(resource);
		const details = await worker.getCompletionEntryDetails(
			resource.toString(),
			offset,
			myItem.label
		);
		if (!details) {
			return myItem;
		}
		return <MyCompletionItem>{
			uri: resource,
			position: position,
			label: details.name,
			kind: SuggestAdapter.convertKind(details.kind),
			detail: displayPartsToString(details.displayParts),
			documentation: {
				value: SuggestAdapter.createDocumentationString(details)
			}
		};
	}

*/

monacoLoader.config({
  paths: {
    // vs: 'monaco-editor/dev/vs',
    // https://unpkg.com/monaco-editor@0.26.0/min/
    // vs: `https://cdn.jsdelivr.net/npm/monaco-editor@0.25.2/min/vs`,
    // as of this writing:
    // use the version to which @monaco-editor/loader defaults
    vs: `https://unpkg.com/monaco-editor@0.25.2/${
      process.env.NODE_ENV === 'development' ? 'dev' : 'min'
    }/vs`,
  },
});

// enum EndOfLine {
// 	LF = 1,
// 	CRLF = 2
// }

// class TextEdit {

// 	static isTextEdit(thing: any): thing is TextEdit {
// 		if (thing instanceof TextEdit) {
// 			return true;
// 		}
// 		if (!thing) {
// 			return false;
// 		}
// 		return Range.isRange((thing))
// 			&& typeof (thing).newText === 'string';
// 	}

// 	static replace(range: Range, newText: string): TextEdit {
// 		return new TextEdit(range, newText);
// 	}

// 	static insert(position: any, newText: string): TextEdit {
// 		return TextEdit.replace(new Range(position, position), newText);
// 	}

// 	static delete(range: Range): TextEdit {
// 		return TextEdit.replace(range, '');
// 	}

// 	static setEndOfLine(eol: any): TextEdit {
// 		const ret = new TextEdit(new Range(new Position(0, 0), new Position(0, 0)), '');
// 		ret.newEol = eol;
// 		return ret;
// 	}

// 	protected _range: Range;
// 	protected _newText: string | null;
// 	protected _newEol?: EndOfLine;

// 	get range(): Range {
// 		return this._range;
// 	}

// 	set range(value: Range) {
// 		// if (value && !Range.isRange(value)) {
// 		// 	throw illegalArgument('range');
// 		// }
// 		this._range = value;
// 	}

// 	get newText(): string {
// 		return this._newText || '';
// 	}

// 	set newText(value: string) {
// 		// if (value && typeof value !== 'string') {
// 		// 	throw illegalArgument('newText');
// 		// }
// 		this._newText = value;
// 	}

// 	get newEol(): EndOfLine | undefined {
// 		return this._newEol;
// 	}

// 	set newEol(value: EndOfLine | undefined) {
// 		// if (value && typeof value !== 'number') {
// 		// 	throw illegalArgument('newEol');
// 		// }
// 		this._newEol = value;
// 	}

// 	constructor(range: Range, newText: string | null) {
// 		this._range = range;
// 		this._newText = newText;
// 	}

// 	toJSON(): any {
// 		return {
// 			range: this.range,
// 			newText: this.newText,
// 			newEol: this._newEol
// 		};
// 	}
// }

// class Range {

// 	// static isRange(thing: any): thing is Range {
// 	// 	if (thing instanceof Range) {
// 	// 		return true;
// 	// 	}
// 	// 	if (!thing) {
// 	// 		return false;
// 	// 	}
// 	// 	return Position.isPosition((thing).start)
// 	// 		&& Position.isPosition((thing.end));
// 	// }

// 	// protected _start: Position;
// 	// protected _end: Position;

// 	get start() {
// 		return this._start;
// 	}

// 	get end() {
// 		return this._end;
// 	}

// 	constructor(start, end);
// 	constructor(startLine: number, startColumn: number, endLine: number, endColumn: number);
// 	constructor(startLineOrStart: number | Position, startColumnOrEnd: number | Position, endLine?: number, endColumn?: number) {
// 		let start: Position | undefined;
// 		let end: Position | undefined;

// 		if (typeof startLineOrStart === 'number' && typeof startColumnOrEnd === 'number' && typeof endLine === 'number' && typeof endColumn === 'number') {
// 			start = new Position(startLineOrStart, startColumnOrEnd);
// 			end = new Position(endLine, endColumn);
// 		} else if (startLineOrStart instanceof Position && startColumnOrEnd instanceof Position) {
// 			start = startLineOrStart;
// 			end = startColumnOrEnd;
// 		}

// 		if (!start || !end) {
// 			throw new Error('Invalid arguments');
// 		}

// 		if (start.isBefore(end)) {
// 			this._start = start;
// 			this._end = end;
// 		} else {
// 			this._start = end;
// 			this._end = start;
// 		}
// 	}

// 	contains(positionOrRange: Position | Range): boolean {
// 		if (positionOrRange instanceof Range) {
// 			return this.contains(positionOrRange._start)
// 				&& this.contains(positionOrRange._end);

// 		} else if (positionOrRange instanceof Position) {
// 			if (positionOrRange.isBefore(this._start)) {
// 				return false;
// 			}
// 			if (this._end.isBefore(positionOrRange)) {
// 				return false;
// 			}
// 			return true;
// 		}
// 		return false;
// 	}

// 	isEqual(other: Range): boolean {
// 		return this._start.isEqual(other._start) && this._end.isEqual(other._end);
// 	}

// 	intersection(other: Range): Range | undefined {
// 		const start = Position.Max(other.start, this._start);
// 		const end = Position.Min(other.end, this._end);
// 		if (start.isAfter(end)) {
// 			// this happens when there is no overlap:
// 			// |-----|
// 			//          |----|
// 			return undefined;
// 		}
// 		return new Range(start, end);
// 	}

// 	union(other: Range): Range {
// 		if (this.contains(other)) {
// 			return this;
// 		} else if (other.contains(this)) {
// 			return other;
// 		}
// 		const start = Position.Min(other.start, this._start);
// 		const end = Position.Max(other.end, this.end);
// 		return new Range(start, end);
// 	}

// 	get isEmpty(): boolean {
// 		return this._start.isEqual(this._end);
// 	}

// 	get isSingleLine(): boolean {
// 		return this._start.line === this._end.line;
// 	}

// 	with(change: { start?: Position, end?: Position; }): Range;
// 	with(start?: Position, end?: Position): Range;
// 	with(startOrChange: Position | undefined | { start?: Position, end?: Position; }, end: Position = this.end): Range {

// 		if (startOrChange === null || end === null) {
// 			throw illegalArgument();
// 		}

// 		let start: Position;
// 		if (!startOrChange) {
// 			start = this.start;

// 		} else if (Position.isPosition(startOrChange)) {
// 			start = startOrChange;

// 		} else {
// 			start = startOrChange.start || this.start;
// 			end = startOrChange.end || this.end;
// 		}

// 		if (start.isEqual(this._start) && end.isEqual(this.end)) {
// 			return this;
// 		}
// 		return new Range(start, end);
// 	}

// 	toJSON(): any {
// 		return [this.start, this.end];
// 	}
// }

// const fromLocations = (start: any, end: any) =>
// 		new Range(
// 			Math.max(0, start.line - 1), Math.max(start.offset - 1, 0),
// 			Math.max(0, end.line - 1), Math.max(0, end.offset - 1));

// const fromTextSpan =  (span: any) =>
//     fromLocations(span.start, span.end);

// const fromCodeEdit = (provider: any, edit: any) =>
// 		new TextEdit(
// 			provider._textSpanToRange(provider.__model, edit.span),
// 			edit.newText);
// }

// // https://github.com/microsoft/vscode/blob/c0bc22edf01538e0462e92902d52ddfdcc9ed7ce/extensions/typescript-language-features/src/languageFeatures/completions.ts#L294-L342
// function getCodeActions(
//     provider: any,
// 		detail: any,
// 		filepath: any
// 	) {
// 		if (!detail.codeActions || !detail.codeActions.length) {
// 			return {};
// 		}

// 		// Try to extract out the additionalTextEdits for the current file.
// 		// Also check if we still have to apply other workspace edits and commands
// 		// using a vscode command
// 		const additionalTextEdits = [];
// 		let hasRemainingCommandsOrEdits = false;
// 		for (const tsAction of detail.codeActions) {
// 			if (tsAction.commands) {
// 				hasRemainingCommandsOrEdits = true;
// 			}

// 			// Apply all edits in the current file using `additionalTextEdits`
// 			if (tsAction.changes) {
// 				for (const change of tsAction.changes) {
// 					if (change.fileName === filepath) {
// 						additionalTextEdits.push(...change.textChanges.map((textChange: any) => fromCodeEdit(provider, textChange)));
// 					} else {
// 						hasRemainingCommandsOrEdits = true;
// 					}
// 				}
// 			}
//     }

// 		let command = undefined;
// 		if (hasRemainingCommandsOrEdits) {
// 			// Create command that applies all edits not in the current file.
// 			// command = {
// 			// 	title: '',
// 			// 	command: ApplyCompletionCodeActionCommand.ID,
// 			// 	arguments: [filepath, detail.codeActions.map((x: any) => ({
// 			// 		commands: x.commands,
// 			// 		description: x.description,
// 			// 		changes: x.changes.filter(x => x.fileName !== filepath)
// 			// 	}))]
// 			// };
// 		}

// 		return {
// 			command,
// 			additionalTextEdits: additionalTextEdits.length ? additionalTextEdits : undefined
// 		};
// 	}

// 892 in entires

// patch
const orig = monacoLoader.init;
monacoLoader.init = function (...args) {
  const cancelable = orig.apply(this, ...args);

  cancelable.then(
    (monaco) => {
      const { registerCompletionItemProvider } = monaco.languages;

      monaco.languages.registerCompletionItemProvider = function (
        language,
        provider,
      ) {
        if (language !== 'typescript') {
          return registerCompletionItemProvider(language, provider);
        }

        provider.provideCompletionItems = async function (
          model,
          position,
          _context,
          token,
        ) {
          (this as any).__model = model;

          const wordInfo = model.getWordUntilPosition(position);
          const wordRange = new monaco.Range(
            position.lineNumber,
            wordInfo.startColumn,
            position.lineNumber,
            wordInfo.endColumn,
          );
          const resource = model.uri;
          const offset = model.getOffsetAt(position);

          const worker = await (this as any)._worker(resource);

          if (model.isDisposed()) {
            return;
          }

          const info = await worker.getCompletionsAtPosition(
            resource.toString(),
            offset,
          );

          if (!info || model.isDisposed()) {
            return;
          }

          const suggestions = info.entries.map((entry: any) => {
            let range = wordRange;
            if (entry.replacementSpan) {
              const p1 = model.getPositionAt(entry.replacementSpan.start);
              const p2 = model.getPositionAt(
                entry.replacementSpan.start + entry.replacementSpan.length,
              );

              range = new monaco.Range(
                p1.lineNumber,
                p1.column,
                p2.lineNumber,
                p2.column,
              );
            }

            const tags = [];
            if (entry.kindModifiers?.indexOf('deprecated') !== -1) {
              tags.push(monaco.languages.CompletionItemTag.Deprecated);
            }

            return {
              uri: resource,
              position: position,
              offset: offset,
              range: range,
              label: entry.name,
              insertText: entry.name,
              sortText: entry.sortText,
              kind: (provider.constructor as any).convertKind(entry.kind),
              tags,
              // added
              data: entry.data,
              source: entry.source,
              hasAction: entry.hasAction,
            };
          });

          return {
            suggestions,
          };
        };

        provider.resolveCompletionItem = function (
          item: any /*, token which stays unused */,
        ) {
          return (this as any)
            ._worker(item.uri)
            .then((worker: any) => {
              return worker.getCompletionEntryDetails(
                (item as any).uri.toString(),
                item.offset,
                item.label,
                /* formatOptions */ {},
                (item as any).uri.toString(), // item.source,
                /* userPreferences */ undefined,
                item.data,
              );
            })
            .then((details: any) => {
              if (!details) {
                return item;
              }
              console.log('codeActions', details.codeActions);
              const textChange =
                details.codeActions?.[0].changes[0].textChanges[0];

              //   debugger
              // const codeAction = getCodeActions(provider, details, (item as any).uri.toString());

              return {
                uri: item.uri,
                position: item.position,
                label: details.name,
                kind: (provider.constructor as any).convertKind(details.kind),
                detail:
                  details.displayParts
                    ?.map((displayPart: any) => displayPart.text)
                    .join('') ?? '',

                // added
                // codeActions: details.codeActions,
                // TODO flatMap this
                additionalTextEdits: textChange && [
                  toTextEdit(provider, textChange),
                ],
                documentation: {
                  value: (provider.constructor as any).createDocumentationString(
                    details,
                  ),
                },
              };
            });

          function toTextEdit(provider: any, textChange: any) {
            console.log('span', textChange.span);
            return {
              text: textChange.newText,
              range: (provider as any)._textSpanToRange(
                provider.__model,
                textChange.span,
              ),
              // range: new monaco.Range(
              //   // text.lineNumber,
              //   // wordInfo.startColumn,
              //   // position.lineNumber,
              //   // wordInfo.endColumn,
              //   0,
              //   0,
              //   0,
              //   0,
              // ),
            };
          }

          // //   {
          // //   const details = ;
          // //   if (!details) {
          // //     return item
          // //   }
          // // })
          // const worker = await this._worker(resource);
          // const details = await worker.getCompletionEntryDetails(
          //   resource.toString(),
          //   offset,
          //   myItem.label,
          // );
          // if (!details) {
          //   return myItem;
          // }
          // return {
          //   uri: resource,
          //   position: position,
          //   label: details.name,
          //   kind: SuggestAdapter.convertKind(details.kind),
          //   detail: displayPartsToString(details.displayParts),
          //   documentation: {
          //     value: SuggestAdapter.createDocumentationString(details),
          //   },
          // };
          // {
          //   /* return resolveCompletionItem!(item, ...rest); */
          // }
        };

        return registerCompletionItemProvider(language, provider);
      };
      console.log(monaco);
    },
    (err) => console.error(err),
  );

  return cancelable;
};

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root'),
);
