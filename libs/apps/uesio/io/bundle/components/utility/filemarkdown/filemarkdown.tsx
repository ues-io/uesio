import { ChangeEvent, FunctionComponent, useEffect } from "react"
import {
	definition,
	styles,
	context,
	collection,
	wire,
	hooks,
	component,
} from "@uesio/ui"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism"

import { FieldState, LabelPosition } from "../../view/field/fielddefinition"

const FileText = component.registry.getUtility("uesio/io.filetext")

interface FileMarkDownProps extends definition.UtilityProps {
	label?: string
	width?: string
	fieldMetadata: collection.Field
	labelPosition?: LabelPosition
	id?: string
	mode?: context.FieldMode
	record: wire.WireRecord
	wire: wire.Wire
}

const FileMarkDown: FunctionComponent<FileMarkDownProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { fieldMetadata, record, wire, context, id, path, mode } = props
	const readonly = mode === "READ"
	const fieldId = fieldMetadata.getId()

	const userFile = record.getFieldValue<wire.PlainWireRecord | undefined>(
		fieldId
	)
	const fileName = userFile?.["uesio/core.name"] as string
	const mimeType = userFile?.["uesio/core.mimetype"] as string

	const fileContent = uesio.file.useUserFile(context, record, fieldId)
	const componentId = id || path || ""
	const currentValue = uesio.component.useExternalState<FieldState>(
		context.getViewId() || "",
		"uesio/io.field",
		componentId
	)

	useEffect(() => {
		uesio.signal.run(
			{
				signal: "component/uesio/io.field/INIT_FILE",
				target: componentId,
				value: fileContent,
				recordId: record.getIdFieldValue(),
				fieldId,
				collectionId: wire.getCollection().getFullName(),
				fileName,
				mimeType,
			},
			context
		)
	}, [fileContent])
	return readonly ? (
		<ReactMarkdown
			children={currentValue?.value || ""}
			remarkPlugins={[remarkGfm]}
			components={{
				code({ node, inline, className, children, ...props }) {
					const match = /language-(\w+)/.exec(className || "")
					return !inline && match ? (
						<SyntaxHighlighter
							children={String(children).replace(/\n$/, "")}
							style={materialDark}
							language={match[1]}
							PreTag="div"
							{...props}
						/>
					) : (
						<code className={className} {...props}>
							{children}
						</code>
					)
				},
			}}
		/>
	) : (
		<FileText {...props} />
	)
}

export default FileMarkDown
