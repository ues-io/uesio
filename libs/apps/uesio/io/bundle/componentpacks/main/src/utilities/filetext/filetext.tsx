import { definition, context, api } from "@uesio/ui"
import {
	CANCEL_FILE_EVENT,
	UPLOAD_FILE_EVENT,
	UserFileMetadata,
} from "../../components/field/field"
import CodeField from "../codefield/codefield"
import MarkDownField, {
	MarkdownFieldOptions,
} from "../markdownfield/markdownfield"

interface FileTextProps {
	path: string
	mode?: context.FieldMode
	userFile?: UserFileMetadata
	onUpload: (files: FileList | File | null) => void
	displayAs?: string
	// An array of URIs which contain ambient type definitions to load in this code field
	typeDefinitionFileURIs?: string[]
	// The Monaco Editor theme to use if rendering a code editor
	theme?: string
	// Markdown options
	markdownOptions?: MarkdownFieldOptions
	// The language to use for syntax highlighting
	language?: string
}

const stringToFile = (value: string, fileName: string, mimeType: string) => {
	const blob = new Blob([value], {
		type: mimeType,
	})
	return new File([blob], fileName, {
		type: mimeType,
	})
}

const FileText: definition.UtilityComponent<FileTextProps> = (props) => {
	const {
		context,
		userFile,
		onUpload,
		markdownOptions,
		mode,
		displayAs,
		language = displayAs === "MARKDOWN" ? "markdown" : undefined,
		id,
		typeDefinitionFileURIs,
		theme,
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
			if (mode === "EDIT") {
				const fileName = userFile?.["uesio/core.path"] || "content.txt"
				const mimeType =
					userFile?.["uesio/core.mimetype"] || "text/plain"
				onUpload(stringToFile(content, fileName, mimeType))
			}
			reset()
		},
		[content, mode]
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

	if (displayAs === "MARKDOWN" && mode !== "EDIT") {
		return (
			<MarkDownField
				context={context}
				value={content}
				mode={mode}
				setValue={changeHandler}
				variant={props.variant}
				options={markdownOptions}
			/>
		)
	}

	return (
		<CodeField
			context={context}
			value={content}
			mode={mode}
			language={language}
			setValue={changeHandler}
			typeDefinitionFileURIs={typeDefinitionFileURIs}
			theme={theme}
		/>
	)
}

export default FileText
