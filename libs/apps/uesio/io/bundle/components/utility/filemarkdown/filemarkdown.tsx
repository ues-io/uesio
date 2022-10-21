import { FunctionComponent } from "react"
import { MDOptions } from "../markdownfield/types"

import {
	definition,
	context,
	collection,
	wire,
	hooks,
	component,
	metadata,
} from "@uesio/ui"

import { FieldState, LabelPosition } from "../../view/field/fielddefinition"

import { MarkDownFieldProps } from "../markdownfield/markdownfield"

const MarkDownField = component.getUtility<MarkDownFieldProps>(
	"uesio/io.markdownfield"
)

interface FileMarkDownProps extends definition.UtilityProps {
	label?: string
	width?: string
	fieldId: string
	fieldMetadata: collection.Field
	labelPosition?: LabelPosition
	id?: string
	mode?: context.FieldMode
	record: wire.WireRecord
	wire: wire.Wire
	variant?: metadata.MetadataKey
	options: MDOptions
}

const FileMarkDown: FunctionComponent<FileMarkDownProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { fieldId, fieldMetadata, record, wire, context, id, mode, options } =
		props

	const userFile = record.getFieldValue<wire.PlainWireRecord>(fieldId)
	const fileName = userFile?.["uesio/core.name"] as string
	const mimeType = "text/markdown; charset=utf-8"

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
		<MarkDownField
			context={context}
			fieldMetadata={fieldMetadata}
			value={state?.value || fileContent || ""}
			mode={mode}
			setValue={(value: string) => {
				if (!state) return
				setState({
					...state,
					value,
				})
			}}
			options={options}
			variant={props.variant}
		/>
	)
}

export default FileMarkDown
