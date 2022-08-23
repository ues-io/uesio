import { FunctionComponent, useEffect } from "react"
import {
	definition,
	context,
	collection,
	component,
	hooks,
	wire,
} from "@uesio/ui"
import { FieldState, LabelPosition } from "../../view/field/fielddefinition"
import { CodeFieldUtilityProps } from "../codefield/codefield"

interface FileTextProps extends definition.UtilityProps {
	label?: string
	width?: string
	fieldId: string
	fieldMetadata: collection.Field
	labelPosition?: LabelPosition
	id?: string
	mode?: context.FieldMode
	record: wire.WireRecord
	wire: wire.Wire
}

const CodeField =
	component.getUtility<CodeFieldUtilityProps>("uesio/io.codefield")

const FileText: FunctionComponent<FileTextProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { fieldId, record, wire, context, id } = props

	const userFile = record.getFieldValue<wire.PlainWireRecord>(fieldId)
	const fileName = userFile?.["uesio/core.name"] as string
	const mimeType = userFile?.["uesio/core.mimetype"] as string

	const fileContent = uesio.file.useUserFile(context, record, fieldId)
	const componentId = uesio.component.getId(id, "uesio/io.field")
	const currentValue =
		uesio.component.useExternalState<FieldState>(componentId)

	useEffect(() => {
		uesio.signal.run(
			{
				signal: "component/uesio/io.field/INIT_FILE",
				target: componentId,
				value: currentValue?.value || fileContent,
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
						signal: "component/uesio/io.field/SET_FILE",
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
