import React, { FunctionComponent, useRef } from "react"
import ToolbarTitle from "../toolbartitle"
import LazyMonaco from "@uesio/lazymonaco"
import { hooks, util, definition } from "@uesio/ui"
import yaml from "yaml"
import CloseIcon from "@material-ui/icons/Close"

const CodeToolbar: FunctionComponent<definition.BaseProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const yamlDoc = uesio.view.useYAML()
	const currentAST = useRef<yaml.Document | undefined>(yamlDoc)
	const str = JSON.stringify(yamlDoc)
	if (str.includes("Yo!")) {
		console.log("yes Yo!")
		console.dir(yamlDoc?.toString())
	} else {
		console.log("no yo!")
		console.dir(yamlDoc?.toString())
	}
	return (
		<>
			<ToolbarTitle
				title="Code"
				icon={CloseIcon}
				iconOnClick={(): void => uesio.builder.setRightPanel("")}
			/>
			<LazyMonaco
				options={{
					selectOnLineNumbers: true,
					lineNumbers: (lineNumber: number): string => {
						if (lineNumber === 10) {
							return "cyan"
						} else {
							return "pink"
						}
					},
				}}
				value={yamlDoc && yamlDoc.toString()}
				onChange={(newValue, event): void => {
					const newAST = util.yaml.parse(newValue)
					if (newAST.errors.length > 0) {
						return
					}
					event.changes.forEach((change) => {
						if (
							currentAST.current?.contents &&
							newAST &&
							newAST.contents
						) {
							// If the change contains newlines, give up. Just parse the entire thing.
							if (change.text.includes("\n")) {
								uesio.view.setYaml("", newAST)
							} else {
								// We need to find the first shared parent of the start offset and end offset
								const [, startPath] = util.yaml.getNodeAtOffset(
									change.rangeOffset,
									currentAST.current.contents,
									""
								)
								const [, endPath] = util.yaml.getNodeAtOffset(
									change.rangeOffset + change.rangeLength,
									currentAST.current.contents,
									""
								)

								const commonPath = util.yaml.getCommonAncestorPath(
									startPath,
									endPath
								)
								const commonNode = util.yaml.getNodeAtPath(
									commonPath,
									currentAST.current.contents
								)

								if (commonNode && commonPath) {
									const newNode = util.yaml.getNodeAtPath(
										commonPath,
										newAST.contents
									)
									if (newNode) {
										const yamlDoc = new yaml.Document()
										yamlDoc.contents = newNode
										uesio.view.setYaml(
											util.yaml.getPathFromPathArray(
												commonPath
											),
											yamlDoc
										)
									}
								}
							}
						}
					})

					currentAST.current = newAST
				}}
				editorWillMount={
					(/*monaco*/): void => {
						/*
					monaco.languages.registerCompletionItemProvider("yaml", {
						provideCompletionItems: function(model, position) {
							return {
								suggestions: [{
									label: "blah",
									kind: monaco.languages.CompletionItemKind.Text,
									insertText: "blah2",
									//range: {startLineNumber: position.lineNumber, startColumn: 1, endLineNumber: position.lineNumber, endColumn: position.column},
								} as any,{
									label: "blah2",
									kind: monaco.languages.CompletionItemKind.Text,
									insertText: "what's going on",
									//range: {startLineNumber: position.lineNumber, startColumn: 1, endLineNumber: position.lineNumber, endColumn: position.column},
								} as any],
							};
						}
					});
					*/
						/*
					monaco.languages.registerHoverProvider("yaml", {
						provideHover: function (model, position) {
							if (model && position && currentAST && currentAST.contents) {
								const offset = model.getOffsetAt(position);
								const [relevantNode, nodePath] = yamlUtils.getNodeAtOffset(offset, currentAST.contents, "", true);
								console.log(relevantNode, nodePath);
								if (relevantNode && relevantNode.range) {
									const startPos = model.getPositionAt(relevantNode.range[0]);
									const endPos = model.getPositionAt(relevantNode.range[0]);
									return {
										range: {startLineNumber: startPos.lineNumber, startColumn: startPos.column, endLineNumber: endPos.lineNumber, endColumn: endPos.column},
										contents: [
											{ value: '**SOURCE**' },
											{ value: '[blah](command:vs.editor.ICodeEditor:1:my-action)', isTrusted: true }
										]
									}
								}

							}
							return null;
						}
					});
					*/
					}
				}
				editorDidMount={(editor /*, monaco*/): void => {
					// Set currentAST again because sometimes monaco reformats the text
					// (like removing trailing spaces and such)
					currentAST.current = util.yaml.parse(editor.getValue())
					editor.onDidChangeCursorPosition((e) => {
						const model = editor.getModel()
						const position = e.position
						if (model && position && currentAST.current?.contents) {
							const offset = model.getOffsetAt(position)
							const [
								relevantNode,
								nodePath,
							] = util.yaml.getNodeAtOffset(
								offset,
								currentAST.current.contents,
								"",
								true
							)
							if (relevantNode && nodePath) {
								uesio.builder.setSelectedNode(nodePath)
							}
						}
					})
					editor.onMouseMove((e) => {
						const model = editor.getModel()
						const position = e.target.position
						if (model && position && currentAST.current?.contents) {
							const offset = model.getOffsetAt(position)
							const [
								relevantNode,
								nodePath,
							] = util.yaml.getNodeAtOffset(
								offset,
								currentAST.current.contents,
								"",
								true
							)
							if (relevantNode && nodePath) {
								uesio.builder.setActiveNode(nodePath)
							}
						}
					})
				}}
			/>
		</>
	)
}

export default CodeToolbar
