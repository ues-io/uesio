import { useEffect, useRef } from "react"
import { definition, component, api, styles, util } from "@uesio/ui"
import type { EditorProps } from "@monaco-editor/react"
import type monaco from "monaco-editor"
import { useSelectedPath } from "../../../api/stateapi"
import { setContent, useContent } from "../../../api/defapi"

const ANIMATION_DURATION = 3000

const getNodeLines = (
	node: util.yaml.lib.Node,
	model: monaco.editor.ITextModel
) => {
	const range = node.range
	if (!range || !range.length) return []
	let startLine = model.getPositionAt(range[0]).lineNumber
	let endLine = model.getPositionAt(range[1]).lineNumber
	if (util.yaml.lib.isMap(node)) {
		startLine--
	}

	if (util.yaml.lib.isScalar(node) && endLine === startLine) {
		endLine++
	}
	return [startLine, endLine]
}

const getSelectedAreaDecorations = (range: monaco.Range, className: string) => [
	{
		range,
		options: {
			isWholeLine: true,
			className,
		},
	},
	{
		range,
		options: {
			marginClassName: className,
		},
	},
]

const CodePanel: definition.UtilityComponent = (props) => {
	const ScrollPanel = component.getUtility("uesio/io.scrollpanel")
	const TitleBar = component.getUtility("uesio/io.titlebar")
	const IconButton = component.getUtility("uesio/io.iconbutton")
	const IOCodeField = component.getUtility("uesio/io.codefield")

	const { context, className } = props

	const classes = styles.useUtilityStyles(
		{
			highlightLines: {
				backgroundColor: "rgb(255,238,240)",
				animation: `lineshighlight ${ANIMATION_DURATION}s ease-in-out`,
			},
			lineDecoration: {
				background: "lightblue",
				opacity: 0.3,
			},
		},
		props
	)

	const [selectedPath, setSelected] = useSelectedPath(context)
	const fullYaml = useContent(selectedPath)

	const yamlDoc = util.yaml.parse(fullYaml)

	const ast = useRef<definition.YamlDoc | undefined>(yamlDoc)
	ast.current = yamlDoc

	const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | undefined>(
		undefined
	)
	const monacoRef = useRef<typeof monaco | undefined>(undefined)
	const decorationsRef = useRef<string[] | undefined>(undefined)

	const e = editorRef.current
	const m = monacoRef.current

	useEffect(() => {
		if (e && m && ast.current && ast.current.contents) {
			const node = util.yaml.getNodeAtPath(
				selectedPath.localPath,
				ast.current.contents
			)

			const model = e.getModel()
			if (!node || !model) return
			const [startLine, endLine] = getNodeLines(node, model)
			const range = new m.Range(startLine, 1, endLine - 1, 1)
			decorationsRef.current = e.deltaDecorations(
				decorationsRef.current || [],
				getSelectedAreaDecorations(range, classes.lineDecoration)
			)

			// scroll to the changes, but only if we're not focused on the editor
			if (!e.hasTextFocus()) {
				e.revealLineInCenter(startLine)
			}

			/*
			// we have to remove the decoration otherwise CSS style kicks in back while clicking on the editor
			setTimeout(() => {
				decorationsRef.current =
					decorationsRef.current &&
					e.deltaDecorations(decorationsRef.current, [])
			}, ANIMATION_DURATION)
			*/
		}
	})

	const monacoOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
		automaticLayout: true,
		minimap: {
			enabled: true,
		},
		fontSize: 10,
		scrollBeyondLastLine: false,
		smoothScrolling: true,
		//quickSuggestions: true,
	}

	const onMount = ((editor, monaco): void => {
		editorRef.current = editor
		monacoRef.current = monaco

		editor.getModel()?.updateOptions({ tabSize: 4 })

		editor.onDidChangeCursorSelection((e) => {
			// Monaco has reasons for cursor change, 3 being explicit within the editor.
			// Everything else we don't want to capture (like updating a property in the ui)
			if (e.reason !== 3) return
			const model = editor.getModel()
			if (!model || !ast.current?.contents) return
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
				ast.current.contents,
				"",
				true
			)

			if (relevantNode && nodePath)
				setSelected(selectedPath.setLocal(nodePath))
		})
		/*

		editor.onMouseMove((e) => {
			const model = editor.getModel()
			const position = e.target.position
			if (
				model &&
				position &&
				currentAST.current?.contents
			) {
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
		*/
	}) as EditorProps["onMount"]

	return (
		<ScrollPanel
			header={
				<TitleBar
					variant="uesio/io.primary"
					title={"code"}
					actions={
						<IconButton
							context={context}
							variant="uesio/builder.buildtitle"
							icon="close"
							onClick={api.signal.getHandler(
								[
									{
										signal: "component/uesio/builder.mainwrapper/TOGGLE_CODE",
									},
								],
								context
							)}
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
						border: "none",
					},
				}}
				language="yaml"
				setValue={
					((newValue): void => {
						setContent(selectedPath, newValue || "")
					}) as EditorProps["onChange"]
				}
				onMount={onMount}
			/>
		</ScrollPanel>
	)
}

export default CodePanel
