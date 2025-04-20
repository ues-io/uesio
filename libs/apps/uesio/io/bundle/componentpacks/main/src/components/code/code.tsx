import { styles, api, definition } from "@uesio/ui"
import IOCodeField from "../../utilities/codefield/codefield"
import { HighlightTheme } from "../../utilities/syntax-highlight"

type CodeComponentDefinition = {
  language?: CodeComponentLanguage
  file: string
  theme?: HighlightTheme
}

type CodeComponentLanguage =
  | "yaml"
  | "json"
  | "javascript"
  | "typescript"
  | "html"
  | "css"

const StyleDefaults = Object.freeze({
  root: [],
})

const CodeComponent: definition.UC<CodeComponentDefinition> = (props) => {
  const { definition, context } = props

  const classes = styles.useStyleTokens(StyleDefaults, props)
  const language = definition?.language || "yaml"
  const fileContent = api.file.useFile(context, definition.file)

  return (
    <IOCodeField
      classes={classes}
      value={fileContent || ""}
      language={language}
      context={context}
      theme={definition?.theme}
      options={{
        lineNumbersMinChars: 0,
      }}
    />
  )
}

export default CodeComponent
