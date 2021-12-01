import { FunctionComponent, useRef, useEffect } from "react"
import { definition, component, hooks, util, styles } from "@uesio/ui"
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
				backgroundColor: "rgb(255,238,240)",
				animation: `lineshighlight ${ANIMATION_DURATION}ms ease-in-out`,
			},
		},
		props
	)
	const metadataType = uesio.builder.useSelectedType()
	const metadataItem = uesio.builder.useSelectedItem()
	const metadataTypeRef = useRef<string>(metadataType)
	const metadataItemRef = useRef<string>(metadataItem)
	metadataTypeRef.current = metadataType
	metadataItemRef.current = metadataItem
	const yamlDoc = uesio.builder.useSelectedYAML()
	const currentYaml = yamlDoc?.toString() || ""
	const lastModifiedNode = uesio.builder.useLastModifiedNode()
	const [lastModifiedType, lastModifiedItem, lastModifiedLocalPath] =
		component.path.getFullPathParts(lastModifiedNode || "")

	const currentAST = useRef<definition.YamlDoc | undefined>(yamlDoc)
	currentAST.current = util.yaml.parse(currentYaml)

	const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | undefined>(
		undefined
	)
	const monacoRef = useRef<typeof monaco | undefined>(undefined)
	const decorationsRef = useRef<string[] | undefined>(undefined)

	const e = editorRef.current
	const m = monacoRef.current

	useEffect(() => {
		if (
			e &&
			m &&
			currentAST.current &&
			lastModifiedNode &&
			lastModifiedType === metadataType &&
			lastModifiedItem === metadataItem &&
			currentAST.current.contents
		) {
			const node = util.yaml.getNodeAtPath(
				lastModifiedLocalPath,
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
							variant="studio.buildtitle"
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

					if (!currentAST.current || !currentAST.current.contents) {
						currentAST.current = newAST
						return
					}

					const curASTContents = currentAST.current.contents
					// If we have any parsing errors, don't continue.
					if (newAST.errors.length > 0) {
						currentAST.current = newAST
						return
					}

					// If there was no actual change to the JSON output, don't continue
					// We may be able to improve performance here with a different approach,
					// but this works for now.
					if (
						JSON.stringify(newAST.toJSON()) ===
						JSON.stringify(currentAST.current?.toJSON())
					) {
						currentAST.current = newAST
						return
					}

					event.changes.forEach((change) => {
						// We need to find the first shared parent of the start offset and end offset
						const [, startPath] = util.yaml.getNodeAtOffset(
							change.rangeOffset,
							curASTContents,
							""
						)
						const [, endPath] = util.yaml.getNodeAtOffset(
							change.rangeOffset + change.rangeLength,
							curASTContents,
							""
						)
						const commonPath = util.yaml.getCommonAncestorPath(
							startPath,
							endPath
						)
						const commonNode = util.yaml.getNodeAtPath(
							commonPath,
							curASTContents
						)
						if (commonNode && commonPath) {
							const newNode = util.yaml.getNodeAtPath(
								commonPath,
								newAST.contents
							)
							if (newNode) {
								const yamlDoc = util.yaml.newDoc()
								yamlDoc.contents = newNode
								uesio.builder.setYaml(
									component.path.makeFullPath(
										metadataTypeRef.current,
										metadataItemRef.current,
										util.yaml.getPathFromPathArray(
											commonPath
										)
									),
									yamlDoc
								)
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
						if (hasSelection) return

						const position = {
							lineNumber: startLineNumber,
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
									metadataTypeRef.current,
									metadataItemRef.current,
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
									metadataTypeRef.current,
									metadataItemRef.current,
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
