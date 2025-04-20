import { definition, context, api } from "@uesio/ui"
import { UserFileMetadata } from "../../components/field/field"
import CodeField from "../codefield/codefield"
import MarkDownField from "../markdownfield/markdownfield"
import { HighlightTheme } from "../syntax-highlight"

type TextOptions = {
  // The language to use for syntax highlighting
  language?: string
  // The Monaco editor theme to use
  theme?: HighlightTheme
  // An array of URIs which contain ambient type definitions to load in this code field
  typeDefinitionFileURIs?: string[]
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

  const language = displayAs === "MARKDOWN" ? "markdown" : textOptions?.language
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
        theme={theme}
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
