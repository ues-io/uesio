import { FunctionComponent } from "react"
import { definition, context, api } from "@uesio/ui"
import { FieldState, UserFileMetadata } from "../../components/field/field"
import CodeField from "../codefield/codefield"

interface FileTextProps extends definition.UtilityProps {
	path: string
	id?: string
	mode?: context.FieldMode
	userFile?: UserFileMetadata
}

const FileText: FunctionComponent<FileTextProps> = (props) => {
	const { context, id, userFile } = props

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
