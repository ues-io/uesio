import { FunctionComponent, useRef, useEffect, CSSProperties } from "react"
import { definition, component, hooks, util, styles } from "@uesio/ui"
import type yaml from "yaml"
import { monaco } from "react-monaco-editor"
import LazyMonaco from "@uesio/lazymonaco"

const ANIMATION_DURATION = 3000

const ScrollPanel = component.registry.getUtility("io.scrollpanel")
const TitleBar = component.registry.getUtility("io.titlebar")
const IconButton = component.registry.getUtility("io.iconbutton")

const CodePanel: FunctionComponent<definition.UtilityProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { context, className } = props
	const classes = styles.useStyles(
		{
			highlightLines: {
				backgroundColor: "pink",
				animation: `lineshighlight ${ANIMATION_DURATION}ms ease-in-out`,
			},
		},
		props
	)
	const [metadataType, metadataItem] = uesio.builder.useSelectedNode()
	const yamlDoc = uesio.builder.useSelectedYAML(metadataType)
	const currentYaml = yamlDoc?.toString() || ""
	const lastModifiedNode = uesio.builder.useLastModifiedNode()

	const currentAST = useRef<yaml.Document | undefined>(yamlDoc)
	currentAST.current = util.yaml.parse(currentYaml)

	const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | undefined>(
		undefined
	)
	const monacoRef = useRef<typeof monaco | undefined>(undefined)
	const decorationsRef = useRef<string[] | undefined>(undefined)

	const e = editorRef.current
	const m = monacoRef.current

	useEffect(() => {
		if (e && m && currentAST.current && lastModifiedNode) {
			const node = util.yaml.getNodeAtPath(
				lastModifiedNode,
				currentAST.current.contents
			)
			const model = e.getModel()
			if (!node || !model) return
			const range = node.range
			if (!range || !range.length) return

			const startLine = model.getPositionAt(range[0]).lineNumber
			let endLine = model.getPositionAt(range[1]).lineNumber

			// Technically the yaml node for maps ends on the next line
			// but we don't want to highlight that line.
			if (node.constructor.name === "YAMLMap" && endLine > startLine) {
				endLine--
			}

			decorationsRef.current = e.deltaDecorations(
				decorationsRef.current || [],
				[
					{
						range: new m.Range(startLine, 1, endLine, 1),
						options: {
							isWholeLine: true,
							className: classes.highlightLines,
						},
					},
				]
			)

			// scroll to the changes
			e.revealLineInCenter(startLine)

			// we have to remove the decoration otherwise CSS style kicks in back while clicking on the editor
			setTimeout(() => {
				decorationsRef.current =
					decorationsRef.current &&
					e.deltaDecorations(decorationsRef.current, [])
			}, ANIMATION_DURATION)
		}
	})

	return (
		<ScrollPanel
			header={
				<TitleBar
					variant="io.primary"
					title={"code"}
					actions={
						<IconButton
							context={context}
							variant="io.small"
							icon="close"
							onClick={uesio.signal.getHandler([
								{
									signal: "component/uesio.runtime/TOGGLE_CODE",
								},
							])}
						/>
					}
					context={context}
				/>
			}
			context={context}
			className={className}
		>
			<LazyMonaco
				value={currentYaml}
				options={{
					automaticLayout: true,
					minimap: {
						enabled: false,
					},
					fontSize: 11,
					scrollBeyondLastLine: false,
					smoothScrolling: true,
					//quickSuggestions: true,
				}}
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

								const commonPath =
									util.yaml.getCommonAncestorPath(
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
										const yamlDoc = util.yaml.newDoc()
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
				editorDidMount={(editor, monaco): void => {
					editorRef.current = editor
					monacoRef.current = monaco
					// Set currentAST again because sometimes monaco reformats the text
					// (like removing trailing spaces and such)
					currentAST.current = util.yaml.parse(editor.getValue())
					// We want to:
					// Or set the selected node when clicking
					// Or clear the selected node when selecting text
					editor.onDidChangeCursorSelection((e) => {
						const model = editor.getModel()
						const {
							endColumn,
							startColumn,
							endLineNumber,
							startLineNumber,
						} = e.selection
						const hasSelection = !(
							endColumn === startColumn &&
							endLineNumber === startLineNumber
						)

						// Check if text is selected, if so... stop
						if (hasSelection)
							return uesio.builder.clearSelectedNode()

						const position = {
							lineNumber: startColumn,
							column: startColumn,
						}

						if (model && currentAST.current?.contents) {
							const offset = model.getOffsetAt(position)
							const [relevantNode, nodePath] =
								util.yaml.getNodeAtOffset(
									offset,
									currentAST.current.contents,
									"",
									true
								)

							if (relevantNode && nodePath)
								uesio.builder.setSelectedNode(
									metadataType,
									metadataItem,
									nodePath
								)
						}
					})

					editor.onMouseMove((e) => {
						const model = editor.getModel()
						const position = e.target.position
						if (model && position && currentAST.current?.contents) {
							const offset = model.getOffsetAt(position)
							const [relevantNode, nodePath] =
								util.yaml.getNodeAtOffset(
									offset,
									currentAST.current.contents,
									"",
									true
								)
							if (relevantNode && nodePath) {
								uesio.builder.setActiveNode(
									metadataType,
									metadataItem,
									nodePath
								)
							}
						}
					})
				}}
			/>
		</ScrollPanel>
	)
}

export default CodePanel
