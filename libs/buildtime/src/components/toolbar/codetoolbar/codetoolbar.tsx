// @ts-nocheck
import React, { FunctionComponent, useRef } from "react"
import ToolbarTitle from "../toolbartitle"
import LazyMonaco from "@uesio/lazymonaco"
import { hooks, util, definition, styles, util } from "@uesio/ui"
import yaml from "yaml"
import CloseIcon from "@material-ui/icons/Close"
import { makeStyles, createStyles } from "@material-ui/core"
import md5 from "md5"
import { diffLines, Change } from "diff"
import setWith from "lodash.setwith"
import toPath from "lodash.topath"
import get from "lodash.get"

const MARKER_FOR_DIFF_START = "##START##"
const ANIMATION_DURATION = 3000
const HIGHLIGHT_LINES_ANIMATION = "monaco-line-highlight"

const useStyles = makeStyles((theme) =>
	createStyles({
		"@keyframes lineshighlight": {
			from: {
				opacity: 1,
			},
			to: {
				opacity: 0,
			},
		},
		[HIGHLIGHT_LINES_ANIMATION]: {
			backgroundColor: (props: definition.BaseProps) =>
				styles.getColor({ intention: "info" }, theme, props.context) ||
				"pink",
			animation: `$lineshighlight ${ANIMATION_DURATION}ms ease-in-out`,
		},
	})
)
/*
const definitionHeight = (definition: AddDefinitionPayload) =>
	Object.keys(definition).length
*/

const splitTextByLines = (text: string) => text.split(/\r?\n/)

const lookForLine = (lines: string[], wordToLookFor: string) =>
	lines.findIndex((line) => line.indexOf(wordToLookFor) !== -1)

const difference = (
	previousYamlDoc: yaml.Document,
	lastAddedDefinition: unknown
) => {
	const previousYaml = previousYamlDoc.toJSON()

	// algo
	// 0. add a marker to the lastAddDefinition object
	// 1. insert the marked lastAddDefiniion to the yamlJsonOld
	// 2. transform to yaml
	// 3. get the line of the marker in the yaml form
	// 4. compute the height of the lasAddedDefinition
	// 5. gather all the previous steps to form the range lines of the changes in the editor

	const keys = Object.keys(lastAddedDefinition?.definition)
	const withMarker = {
		...lastAddedDefinition,
		definition: {
			[keys[0] + MARKER_FOR_DIFF_START]: {
				...lastAddedDefinition?.definition[keys[0]],
			},
		},
	}

	const { path, definition, index } = withMarker
	const pathArray = toPath(path)
	const currentArray = get(previousYaml, pathArray) || []

	// insert the new definition in the currentArray
	currentArray.splice(index, 0, definition)

	const newYamlDoc = util.yaml.parse(JSON.stringify(previousYaml))
	const newYamlStringified = newYamlDoc.toString()
	const startOffset =
		lookForLine(
			splitTextByLines(newYamlStringified),
			MARKER_FOR_DIFF_START
		) + 1
	console.log(
		"withMarker.definition[keys[0] + MARKER_FOR_DIFF_START]",
		withMarker.definition[keys[0] + MARKER_FOR_DIFF_START]
	)
	const endOffset =
		startOffset +
		Object.keys(withMarker.definition[keys[0] + MARKER_FOR_DIFF_START])
			.length

	return [startOffset, endOffset]
}

const CodeToolbar: FunctionComponent<definition.BaseProps> = (props) => {
	const classes = useStyles(props)
	const uesio = hooks.useUesio(props)
	const yamlDoc = uesio.view.useYAML()
	const currentYaml = yamlDoc?.toString()

	const currentAST = useRef<yaml.Document | undefined>(yamlDoc)
	const previousYaml = currentAST.current?.toString()
	const hasYamlChanged = previousYaml !== currentYaml
	const lastAddedDefinition = uesio.view.useLastAddedDefinition()
	if (hasYamlChanged) {
		console.log(
			"difference",
			currentAST.current &&
				lastAddedDefinition &&
				difference(currentAST.current, lastAddedDefinition)
		)
	}
	console.log("CodeToolbar rendering")

	return (
		<>
			<ToolbarTitle
				title="Code"
				icon={CloseIcon}
				iconOnClick={(): void => uesio.builder.setRightPanel("")}
			/>
			<LazyMonaco
				// force the LazyMonaco component to unmount and create a new component if hasYamlChanged is true
				{...(hasYamlChanged && currentYaml
					? { key: md5(currentYaml) }
					: {})}
				// id used for the scroll to
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
				editorDidMount={(editor, monaco): void => {
					console.log("codeToolbar has mount")
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

					// highlight changes in the editor
					if (hasYamlChanged && previousYaml && currentYaml) {
						const diff: Change[] = diffLines(
							previousYaml,
							currentYaml
						)
						if (
							diff?.[0]?.count &&
							diff?.[1]?.count &&
							diff?.[1]?.added
						) {
							// Small adjustment when the first line of the change is by coincidence matching the first line of the next block
							const firstLineDifference = diff?.[1]?.value.trim()
							const shouldStartOneLineAbove = !firstLineDifference.startsWith(
								"-"
							)

							const startOffset =
								diff[0].count +
								1 -
								(shouldStartOneLineAbove ? 1 : 0)
							const endOffset = startOffset + diff[1].count - 1
							const decorations = editor.deltaDecorations(
								[],
								[
									{
										range: new monaco.Range(
											startOffset,
											1,
											endOffset,
											1
										),
										options: {
											isWholeLine: true,
											className:
												classes[
													HIGHLIGHT_LINES_ANIMATION
												],
										},
									},
								]
							)

							editor.revealLineInCenter(endOffset)

							// we have to remove the decoration otherwise css kicks in while interacting with the editor
							setTimeout(
								() => editor.deltaDecorations(decorations, []),
								ANIMATION_DURATION
							)
						}
					}
				}}
			/>
		</>
	)
}

export default CodeToolbar
