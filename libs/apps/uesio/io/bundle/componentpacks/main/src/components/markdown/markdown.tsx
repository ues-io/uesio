import { api, context, definition, component } from "@uesio/ui"
import MarkDownField from "../../utilities/markdownfield/markdownfield"

type MarkDownDefinition = {
  file?: string
  markdown?: string
  mode: context.FieldMode
}

const MarkDown: definition.UC<MarkDownDefinition> = (props) => {
  const { definition, context } = props
  return (
    <MarkDownField
      variant={definition[component.STYLE_VARIANT]}
      styleTokens={definition[component.STYLE_TOKENS]}
      context={context}
      value={context.merge(
        definition.file
          ? api.file.useFile(context, definition.file)
          : definition.markdown,
      )}
      mode={"READ"}
    />
  )
}

export default MarkDown
