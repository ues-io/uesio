// @ts-nocheck
import React, { FunctionComponent, useEffect, useRef } from "react"
import ToolbarTitle from "../toolbartitle"
import LazyMonaco from "@uesio/lazymonaco"
import { hooks, util, definition, styles } from "@uesio/ui"
import yaml from "yaml"
import CloseIcon from "@material-ui/icons/Close"
import { makeStyles, createStyles } from "@material-ui/core"
import md5 from "md5"
import { diffLines, Change } from "diff"

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
				styles.getColor({ intention: "primary" }, theme, props.context),
			animation: `$lineshighlight ${ANIMATION_DURATION}ms ease-in-out`,
		},
	})
)

const customScrollToElement = (
	element: HTMLElement,
	container: HTMLElement
) => {
	const topPos = element.offsetTop
	if (topPos && container?.scrollTop) {
		container.scrollTop = topPos - 10
	}
}

const getAllHighlightedNodes = (substring: string) =>
	document.querySelectorAll(`[class*="${substring}"]`)

const toggleClass = (
	nodes: NodeListOf<Element>,
	highlightSubstring: string,
	noHighlightClass: string
): void => {
	const highlightClassPattern = new RegExp(
		`([^\\s]*${highlightSubstring}[^\\s]*)`,
		"gi"
	)
	nodes.forEach((node) => {
		if (node?.className?.replace) {
			node.className = node?.className.replace(
				highlightClassPattern,
				noHighlightClass
			)
		}
	})
}

const CodeToolbar: FunctionComponent<definition.BaseProps> = (props) => {
	const classes = useStyles(props)
	const uesio = hooks.useUesio(props)
	const yamlDoc = uesio.view.useYAML()
	const currentYaml = yamlDoc?.toString()

	const currentAST = useRef<yaml.Document | undefined>(yamlDoc)
	const previousYaml = currentAST.current?.toString()
	const hasYamlChanged = previousYaml !== currentYaml

	useEffect(() => {
		if (hasYamlChanged && previousYaml && currentYaml) {
			setTimeout(() => {
				const highlightedNodes = getAllHighlightedNodes(
					HIGHLIGHT_LINES_ANIMATION
				)
				highlightedNodes?.[0]?.scrollTo?.()
			}, 0)
		}
	})

	/*
	useEffect(() => {
		if (hasYamlChanged && previousYaml && currentYaml) {
			setTimeout(() => {
				toggleClass(
					getAllHighlightedNodes(WITH_LINE_HIGHLIGHT_CLASS),
					WITH_LINE_HIGHLIGHT_CLASS,
					classes[WITHOUT_LINE_HIGHLIGHT_CLASS]
				)
			}, 1000)
		}
	})*/

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
							const startOffset = diff[0].count + 1
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
