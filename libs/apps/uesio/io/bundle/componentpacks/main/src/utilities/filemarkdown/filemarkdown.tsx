import { FunctionComponent } from "react"
import { MDOptions } from "../markdownfield/types"

import { definition, context, api } from "@uesio/ui"

import { FieldState, UserFileMetadata } from "../../components/field/field"
import MarkDownField from "../markdownfield/markdownfield"

interface FileMarkDownProps extends definition.UtilityProps {
	path: string
	id?: string
	mode?: context.FieldMode
	userFile?: UserFileMetadata
	onUpload: (files: FileList | null) => void
	onDelete?: () => void
	accept?: string
	options?: MDOptions
}

const FileMarkDown: FunctionComponent<FileMarkDownProps> = (props) => {
	const { context, id, mode, options, userFile } = props

	const fileContent = api.file.useUserFile(context, userFile)
	const componentId = api.component.getComponentId(
		id,
		"uesio/io.field",
		props.path,
		context
	)
	const [state, setState] = api.component.useState<FieldState>(componentId, {
		value: fileContent,
		originalValue: fileContent,
		fileInfo: userFile,
	})

	return (
		<MarkDownField
			context={context}
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
