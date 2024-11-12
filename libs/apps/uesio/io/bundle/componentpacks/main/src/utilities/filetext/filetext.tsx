import { definition, context, api } from "@uesio/ui"
import { UserFileMetadata } from "../../components/field/field"
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
	displayAs?: string
	textOptions?: TextOptions
	onChange?: (value: string) => void
}

const FileText: definition.UtilityComponent<FileTextProps> = (props) => {
	const { context, userFile, textOptions, mode, displayAs, onChange } = props

	const markdownOptions = textOptions?.markdownOptions
	const language =
		textOptions?.language || displayAs === "MARKDOWN"
			? "markdown"
			: undefined
	const typeDefinitionFileURIs = textOptions?.typeDefinitionFileURIs
	const theme = textOptions?.theme

	const content = api.file.useUserFile(context, userFile)

	if (displayAs === "MARKDOWN" && mode !== "EDIT") {
		return (
			<MarkDownField
				context={context}
				value={content}
				mode={mode}
				setValue={onChange}
				variant={props.variant}
				options={markdownOptions}
			/>
		)
	}

	return (
		<CodeField
			context={context}
			value={content || ""}
			mode={mode}
			language={language}
			setValue={onChange}
			typeDefinitionFileURIs={typeDefinitionFileURIs}
			theme={theme}
		/>
	)
}

export type { TextOptions }

export default FileText
