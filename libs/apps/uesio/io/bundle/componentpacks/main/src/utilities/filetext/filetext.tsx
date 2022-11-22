import { FunctionComponent } from "react"
import {
	definition,
	context,
	collection,
	component,
	hooks,
	wire,
} from "@uesio/ui"
import { FieldState, LabelPosition } from "../../components/field/fielddefinition"
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
	const [state, setState] = uesio.component.useState<FieldState>(
		componentId,
		{
			value: fileContent,
			originalValue: fileContent,
			recordId: record.getIdFieldValue() || "",
			fieldId,
			collectionId: wire.getCollection().getFullName(),
			fileName,
			mimeType,
		}
	)

	return (
		<CodeField
			context={context}
			value={state?.value || fileContent || ""}
			setValue={(value: string) => {
				if (!state) return
				setState({
					...state,
					value,
				})
			}}
		/>
	)
}

export default FileText
