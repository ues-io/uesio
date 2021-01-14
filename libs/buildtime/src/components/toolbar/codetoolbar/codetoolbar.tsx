// @ts-nocheck
import React, { FunctionComponent, useRef } from "react"
import ToolbarTitle from "../toolbartitle"
import LazyMonaco from "@uesio/lazymonaco"
import { hooks, util, definition, styles } from "@uesio/ui"
import yaml from "yaml"
import CloseIcon from "@material-ui/icons/Close"
import { makeStyles, createStyles } from "@material-ui/core"
import md5 from "md5"
import toPath from "lodash.topath"
import get from "lodash.get"
import { POINT_CONVERSION_COMPRESSED } from "constants"

const MARKER_FOR_DIFF_START = "##START##"
const MARKER_FOR_DIFF_END = "##END##"
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

const addMarkerAtFirstKey = (addedDefinition: unknown) => {
	const keys = Object.keys(addedDefinition?.definition || {})
	const withMarker = {
		...addedDefinition,
		definition: {
			[`${keys?.[0] || ""}${MARKER_FOR_DIFF_START}`]: {
				...(keys?.[0] ? addedDefinition?.definition[keys[0]] : {}),
			},
		},
	}
	return withMarker
}

const addMarkerAtFirstKeyEnd = (slot: unknown) => {
	const keys = Object.keys(slot || {})
	const withMarker = {
		[`${keys?.[0] || ""}${MARKER_FOR_DIFF_END}`]: {
			...(keys?.[0] ? slot[keys[0]] : {}),
		},
	}
	return withMarker
}

// AddDefinitionPayload
const definitionPropertiesAmount = (addedDefinition: unknown) => {
	const keys = Object.keys(addedDefinition?.definition || {})
	const componentName = keys?.[0]
	return componentName
		? Object.keys(addedDefinition.definition[componentName]).length
		: 0
}

const splitTextByLines = (text: string) => text.split(/\r?\n/)

const lookForLine = (lines: string[], wordToLookFor: string) =>
	lines.findIndex((line) => line.indexOf(wordToLookFor) !== -1)

// home-made diff algorithm since unix-like diff method did not work for our use case
const diff = (
	previousYamlDocInJon: yaml.Document,
	lastAddedDefinition: unknown
): [number, number] => {
	// algorithm
	// 0. add a marker to last added definition (drag'n drop into the canvas) and to next item
	// 0bis add marker to next item
	// 1. insert the marked definition to the previous YAML definition in JSON formatted

	// 2. create a new YAML document with new added definition
	// 3. transform the YAML document into a string
	// 4. get the line of the marker in the stringified YAML document
	// 5. compute the height of the lasAddedDefinition
	// 6. return lines range of the changes (start with index 1 and not 0 for the monaco editor)

	// step 0.
	const withMarkerStart = addMarkerAtFirstKey(lastAddedDefinition)
	const { path, definition, index } = withMarkerStart
	const pathArray = toPath(path)
	const children = get(previousYamlDocInJon, pathArray)

	// step 1. insert the new definition in the children, with mutation of previousYaml
	children.splice(index, 0, definition)

	// step 0bis
	const isAddedDefinitionLastChildren =
		children && children.length - 1 === index
	const nextChild =
		(!isAddedDefinitionLastChildren && children && children[index + 1]) ||
		null

	if (nextChild) {
		// mutation of previousYaml with marker for the end
		children[index + 1] = addMarkerAtFirstKeyEnd(nextChild)
	}
	console.log("previousYamlDocInJon", previousYamlDocInJon)

	// step 2.
	const newYamlDoc = util.yaml.parse(JSON.stringify(previousYamlDocInJon))
	// step 3.
	const newYamlDocStringified = newYamlDoc.toString()
	const splittedByLines = splitTextByLines(newYamlDocStringified)
	// step 4.
	const startOffset = lookForLine(splittedByLines, MARKER_FOR_DIFF_START) + 1
	// step 5.
	const endOffset = nextChild
		? lookForLine(splittedByLines, MARKER_FOR_DIFF_END)
		: children.length
	// step 6.
	return [startOffset, endOffset]
}

const CodeToolbar: FunctionComponent<definition.BaseProps> = (props) => {
	const classes = useStyles(props)
	const uesio = hooks.useUesio(props)
	const yamlDoc = uesio.view.useYAML()
	const currentYaml = yamlDoc?.toString()

	const currentAST = useRef<yaml.Document | undefined>(yamlDoc)
	const previousYaml = currentAST.current?.toString()
	const previousYamlInJson = currentAST.current?.toJSON()
	const hasYamlChanged = previousYaml !== currentYaml
	const lastAddedDefinition = uesio.view.useLastAddedDefinition()
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
					if (
						hasYamlChanged &&
						previousYamlInJson &&
						lastAddedDefinition
					) {
						const rangeDiff = diff(
							previousYamlInJson,
							lastAddedDefinition
						)

						const decorations = editor.deltaDecorations(
							[],
							[
								{
									range: new monaco.Range(
										rangeDiff[0],
										1,
										rangeDiff[1],
										1
									),
									options: {
										isWholeLine: true,
										className:
											classes[HIGHLIGHT_LINES_ANIMATION],
									},
								},
							]
						)

						// scroll to the changes
						editor.revealLineInCenter(rangeDiff[1])

						// we have to remove the decoration otherwise css kicks in while interacting with the editor
						setTimeout(
							() => editor.deltaDecorations(decorations, []),
							ANIMATION_DURATION
						)
					}
				}}
			/>
		</>
	)
}

export default CodeToolbar
