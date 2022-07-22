import { FunctionComponent, useEffect, useRef } from "react"
import yaml from "yaml"

import { definition, component, hooks, styles, util } from "@uesio/ui"
import type { EditorProps } from "@monaco-editor/react"
import type TMonaco from "monaco-editor"

const ScrollPanel = component.getUtility("uesio/io.scrollpanel")
const TitleBar = component.getUtility("uesio/io.titlebar")
const IconButton = component.getUtility("uesio/io.iconbutton")
const IOCodeField = component.getUtility("uesio/io.codefield")

const usePrevious = (value: string) => {
	const ref = useRef("")
	useEffect(() => {
		ref.current = value
	})
	return ref.current
}

const CodePanel: FunctionComponent<definition.UtilityProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { context, className } = props

	// When seting decorations, we need to save the return value for unsetting them again,
	const decorationsRef = useRef<string[] | undefined>(undefined)

	const classes = styles.useStyles(
		{
			highlightLines: {
				backgroundColor: "rgb(255,238,240)",
				animation: `lineshighlight 0.3s ease-in-out`,
			},
			lineDecoration: {
				background: "lightblue",
				opacity: 0.4,
			},
		},
		props
	)

	const viewId = context.getViewDefId() || ""
	const metadataType = uesio.builder.useSelectedType() || "viewdef"
	const metadataItem =
		uesio.builder.useSelectedItem() ||
		(metadataType === "viewdef" ? viewId : "")
	const metadataTypeRef = useRef<string>(metadataType)
	const metadataItemRef = useRef<string>(metadataItem)
	metadataTypeRef.current = metadataType
	metadataItemRef.current = metadataItem

	const fullYaml =
		uesio.builder.useDefinitionContent(metadataType, metadataItem) || ""
	const yamlDoc = util.yaml.parse(fullYaml)
	const lastModifiedNode = uesio.builder.useLastModifiedNode()
	const [, , selectedNodePath] = uesio.builder.useSelectedNode()
	const [, , lastModifiedLocalPath] = component.path.getFullPathParts(
		lastModifiedNode || ""
	)
	const currentAST = useRef<definition.YamlDoc | undefined>(yamlDoc)
	currentAST.current = yamlDoc

	const monacoObjects = useRef<{
		editor: TMonaco.editor.IStandaloneCodeEditor
		monaco: typeof TMonaco
	} | null>(null)

	const onMount = (
		editor: TMonaco.editor.IStandaloneCodeEditor,
		monaco: typeof TMonaco
	) => {
		monacoObjects.current = {
			editor,
			monaco,
		}

		monaco.languages.json.jsonDefaults

		editor.onDidChangeCursorSelection((e) => {
			// Monaco has reasons for cursor change, 3 being explicit within the editor.
			// Everything else we don't want to capture (like updating a property in the ui)
			if (e.reason !== 3) return
			const model = editor.getModel()
			if (!model || !currentAST.current?.contents) return
			const { endColumn, startColumn, endLineNumber, startLineNumber } =
				e.selection

			// Check if text is selected, if so... stop
			if (endColumn !== startColumn || endLineNumber !== startLineNumber)
				return
			const offset = model.getOffsetAt({
				lineNumber: startLineNumber,
				column: startColumn,
			})
			const [relevantNode, nodePath] = util.yaml.getNodeAtOffset(
				offset,
				currentAST.current.contents,
				"",
				true
			)

			// Remove decorations
			decorationsRef.current =
				decorationsRef.current &&
				editor.deltaDecorations(decorationsRef.current, [])

			if (relevantNode && nodePath)
				uesio.builder.setSelectedNode(
					metadataTypeRef.current,
					metadataItemRef.current,
					nodePath
				)
		})
	}

	const modifiedNode = util.yaml.getNodeAtPath(
		lastModifiedLocalPath,
		currentAST.current.contents
	)
	const selectedNode = util.yaml.getNodeAtPath(
		selectedNodePath,
		currentAST.current.contents
	)

	const getNodeLines = (
		node: yaml.Node,
		model: TMonaco.editor.ITextModel
	) => {
		const range = node.range
		if (!range || !range.length) return []
		let startLine = model.getPositionAt(range[0]).lineNumber
		let endLine = model.getPositionAt(range[1]).lineNumber
		if (node.constructor.name === "YAMLMap") {
			startLine--
		}
		if (node.constructor.name === "Scalar" && endLine === startLine) {
			endLine++
		}
		return [startLine, endLine]
	}

	const highlightNode = (node: yaml.Node | null) => {
		if (!monacoObjects.current || !currentAST.current) return

		const { monaco, editor } = monacoObjects.current

		const model = editor.getModel()
		if (!node || !model) return
		const [startLine, endLine] = getNodeLines(node, model)

		editor.revealLineInCenter(startLine)
		decorationsRef.current = editor.deltaDecorations(
			decorationsRef.current || [],
			[
				{
					range: new monaco.Range(startLine, 1, endLine, 1),
					options: {
						className: classes.lineDecoration,
					},
				},
				{
					range: new monaco.Range(startLine, 1, endLine - 1, 1),
					options: {
						marginClassName: classes.lineDecoration,
					},
				},
			]
		)
	}

	// Highlight on Input
	useEffect(() => {
		console.log("Running Modified", { lastModifiedLocalPath })
		highlightNode(modifiedNode)
	}, [modifiedNode, monacoObjects, selectedNodePath])
	// Highlight on selection
	const prevSelectedPath = usePrevious(selectedNodePath)
	useEffect(() => {
		// When we modify nodes, this useEffect is still triggered, we don't want that
		if (prevSelectedPath === selectedNodePath) return
		highlightNode(selectedNode)
	}, [selectedNode])

	const monacoOptions: TMonaco.editor.IStandaloneEditorConstructionOptions = {
		automaticLayout: true,
		minimap: {
			enabled: true,
		},
		fontSize: 10,
		scrollBeyondLastLine: false,
		smoothScrolling: true,
		quickSuggestions: false,
	}

	return (
		<ScrollPanel
			header={
				<TitleBar
					variant="uesio/io.primary"
					title={"code"}
					actions={
						<IconButton
							context={context}
							variant="uesio/studio.buildtitle"
							icon="close"
							onClick={uesio.signal.getHandler([
								{
									signal: "component/uesio/studio.runtime/TOGGLE_CODE",
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
			<IOCodeField
				context={context}
				value={fullYaml}
				options={monacoOptions}
				styles={{
					input: {
						padding: 0,
						height: "100%",
					},
				}}
				language="yaml"
				setValue={
					((newValue): void => {
						uesio.builder.setDefinitionContent(
							metadataTypeRef.current,
							metadataItemRef.current,
							newValue || ""
						)
						/*
						const newAST = util.yaml.parse(newValue || "")

						if (
							!currentAST.current ||
							!currentAST.current.contents
						) {
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
						*/
					}) as EditorProps["onChange"]
				}
				onMount={onMount}
			/>
		</ScrollPanel>
	)
}

export default CodePanel
