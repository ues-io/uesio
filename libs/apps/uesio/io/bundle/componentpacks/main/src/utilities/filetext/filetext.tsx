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

type TextOptions = {
	// The language to use for syntax highlighting
	language?: string
	// The Monaco editor theme to use
	theme?: string
	// An array of URIs which contain ambient type definitions to load in this code field
	typeDefinitionFileURIs?: string[]
	// Markdown options
	markdownOptions?: MarkdownFieldOptions
}

interface FileTextProps {
	mode?: context.FieldMode
	userFile?: UserFileMetadata
	onUpload: (files: FileList | File | null) => void
	displayAs?: string
	textOptions?: TextOptions
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
	const { context, userFile, onUpload, textOptions, mode, displayAs, id } =
		props

	const markdownOptions = textOptions?.markdownOptions
	const language =
		textOptions?.language || displayAs === "MARKDOWN"
			? "markdown"
			: undefined
	const typeDefinitionFileURIs = textOptions?.typeDefinitionFileURIs
	const theme = textOptions?.theme

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

export type { TextOptions }

export default FileText
