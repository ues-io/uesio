import { FunctionComponent, useEffect } from "react"
import {
	definition,
	context,
	collection,
	component,
	hooks,
	wire,
} from "@uesio/ui"
import { FieldState, LabelPosition } from "../../view/io.field/fielddefinition"

interface FileTextProps extends definition.UtilityProps {
	label?: string
	width?: string
	fieldMetadata: collection.Field
	labelPosition?: LabelPosition
	id?: string
	mode?: context.FieldMode
	record: wire.WireRecord
	wire: wire.Wire
}

const CodeField = component.registry.getUtility("io.codefield")

const FileText: FunctionComponent<FileTextProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { fieldMetadata, record, wire, context, id, path } = props
	const fieldId = fieldMetadata.getId()

	const userFile = record.getFieldValue<wire.PlainWireRecord | undefined>(
		fieldId
	)
	const fileName = userFile?.["uesio.name"] as string
	const mimeType = userFile?.["uesio.mimetype"] as string

	const fileContent = uesio.file.useUserFile(context, record, fieldId)
	const componentId = id || path || ""
	const currentValue = uesio.component.useExternalState<FieldState>(
		context.getViewId() || "",
		"io.field",
		componentId
	)

	useEffect(() => {
		uesio.signal.run(
			{
				signal: "component/io.field/INIT_FILE",
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
	return (
		<CodeField
			context={context}
			value={currentValue?.value || ""}
			setValue={(value: string) => {
				uesio.signal.run(
					{
						signal: "component/io.field/SET_FILE",
						target: componentId,
						value,
					},
					context
				)
			}}
		/>
	)
}

export default FileText
