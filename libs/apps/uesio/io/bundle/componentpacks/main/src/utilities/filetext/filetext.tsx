import { FunctionComponent } from "react"
import { definition, context, api } from "@uesio/ui"
import {
	CANCEL_FILE_EVENT,
	UPLOAD_FILE_EVENT,
	UserFileMetadata,
} from "../../components/field/field"
import CodeField from "../codefield/codefield"
import MarkDownField from "../markdownfield/markdownfield"

interface FileTextProps extends definition.UtilityProps {
	path: string
	mode?: context.FieldMode
	userFile?: UserFileMetadata
	onUpload: (files: FileList | File | null) => void
	displayAs?: string
	// An array of URIs which contain ambient type definitions to load in this code field
	typeDefinitionFileURIs?: string[]
}

const stringToFile = (value: string, fileName: string, mimeType: string) => {
	const blob = new Blob([value], {
		type: mimeType,
	})
	return new File([blob], fileName, {
		type: mimeType,
	})
}

const FileText: FunctionComponent<FileTextProps> = (props) => {
	const {
		context,
		userFile,
		onUpload,
		mode,
		displayAs,
		id,
		typeDefinitionFileURIs,
	} = props

	const [content, original, setContent, reset, cancel] = api.file.useUserFile(
		context,
		userFile
	)

	const changeHandler = (value: string) => {
		setContent(value)
	}

	api.event.useEvent(
		UPLOAD_FILE_EVENT,
		(e) => {
			const isTarget = id && id.startsWith(e.detail.target)
			if (!isTarget) return
			const fileName = userFile?.["uesio/core.path"] || "content.txt"
			const mimeType = userFile?.["uesio/core.mimetype"] || "text/plain"
			onUpload(stringToFile(content, fileName, mimeType))
			reset()
		},
		[content]
	)

	api.event.useEvent(
		CANCEL_FILE_EVENT,
		(e) => {
			const isTarget = id && id.startsWith(e.detail.target)
			if (!isTarget) return
			cancel()
		},
		[original]
	)

	const language = displayAs === "MARKDOWN" ? "markdown" : undefined

	if (displayAs === "MARKDOWN" && mode !== "EDIT") {
		return (
			<MarkDownField
				context={context}
				value={content}
				mode={mode}
				setValue={changeHandler}
				variant={props.variant}
			/>
		)
	}

	return (
		<CodeField
			context={context}
			value={content}
			language={language}
			setValue={changeHandler}
			typeDefinitionFileURIs={typeDefinitionFileURIs}
		/>
	)
}

export default FileText
