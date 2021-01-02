import React, { FunctionComponent, useEffect, useRef, useState } from "react"
import ToolbarTitle from "../toolbartitle"
import LazyMonaco from "@uesio/lazymonaco"
import { hooks, util, definition, styles } from "@uesio/ui"
import yaml from "yaml"
import CloseIcon from "@material-ui/icons/Close"
import { makeStyles, createStyles } from "@material-ui/core"
import md5 from "md5"
import { diffLines, Change } from "diff"

const useStyles = makeStyles((theme) =>
	createStyles({
		myLineDecoration: (props: definition.BaseProps) => ({
			backgroundColor: styles.getColor(
				{ intention: "primary" },
				theme,
				props.context
			),
			width: "5px !important",
			marginLeft: "10px",
		}),
	})
)

const CodeToolbar: FunctionComponent<definition.BaseProps> = (props) => {
	const classes = useStyles(props)
	const uesio = hooks.useUesio(props)
	const yamlDoc = uesio.view.useYAML()
	const currentAST = useRef<yaml.Document | undefined>(yamlDoc)

	const yamlDocContent = yamlDoc?.toString()
	const previousYaml = useRef<string | undefined>(yamlDocContent)
	const [hasYamlChanged, setHasYamlChanged] = useState<boolean>(false)
	const yamlDiff = useRef<Array<Change>>([])

	// code responsible for tracking change upon drag'n dropping in the builder
	useEffect(() => {
		if (
			previousYaml !== undefined &&
			yamlDocContent !== undefined &&
			yamlDocContent !== previousYaml.current
		) {
			setHasYamlChanged(() => {
				const diff = diffLines(
					previousYaml.current as string,
					yamlDocContent as string
				)
				// update ref for the next re-rendering
				previousYaml.current = yamlDocContent
				yamlDiff.current = diff
				return true
			})
		} else {
			setHasYamlChanged(() => {
				// update ref for the next re-rendering
				previousYaml.current = yamlDocContent
				yamlDiff.current = []
				return false
			})
		}
	}, [yamlDocContent])

	/*
	useEffect(() => {
		if (hasYamlChanged) {
			setYamlDiff(() => {
				const diff = diffLines(
					previousYaml.current as string,
					yamlDocContent as string
				)
				previousYaml.current = yamlDocContent
				return diff
			})
		} else {
			setYamlDiff(() => {
				previousYaml.current = yamlDocContent
				return []
			})
		}
		// update ref for the next re-rendering
	}, [hasYamlChanged])
*/
	return (
		<>
			<ToolbarTitle
				title="Code"
				icon={CloseIcon}
				iconOnClick={(): void => uesio.builder.setRightPanel("")}
			/>
			<LazyMonaco
				// force the LazyMonaco component to unmount if hasYamlChanged is true
				{...(hasYamlChanged && yamlDocContent
					? { key: md5(yamlDocContent) }
					: {})}
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
					// code responsible for highlighting the changes reflected in the yaml structure
					if (hasYamlChanged) {
						console.log("decoration previousYaml", previousYaml)
						console.log("decoration hasYamlChanded", hasYamlChanged)
						console.log("decoration yamlDiff", yamlDiff)
						if (
							yamlDiff?.current?.[0]?.count &&
							yamlDiff?.current?.[1]?.count &&
							yamlDiff?.current?.[1]?.added
						) {
							const startOffset = yamlDiff.current[0].count + 1
							const endOffset =
								startOffset + yamlDiff.current[1].count - 1
							editor.deltaDecorations(
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
											linesDecorationsClassName:
												classes.myLineDecoration,
										},
									},
								]
							)
						}
					}
				}}
			/>
		</>
	)
}

export default CodeToolbar
