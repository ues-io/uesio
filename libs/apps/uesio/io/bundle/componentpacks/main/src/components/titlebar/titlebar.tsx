import { api, component, definition } from "@uesio/ui"
import { default as IOTitleBar } from "../../utilities/titlebar/titlebar"

type TitleBarDefinition = {
  title: string
  subtitle: string
  avatar?: definition.DefinitionList
  actions?: definition.DefinitionList
}

const TitleBar: definition.UC<TitleBarDefinition> = (props) => {
  const { definition, path, context, componentType } = props

  return (
    <IOTitleBar
      id={api.component.getComponentIdFromProps(props)}
      context={context}
      variant={definition[component.STYLE_VARIANT]}
      styleTokens={definition[component.STYLE_TOKENS]}
      title={definition.title}
      subtitle={definition.subtitle}
      actions={
        definition.actions && (
          <component.Slot
            definition={definition}
            listName="actions"
            path={path}
            context={context}
            componentType={componentType}
          />
        )
      }
      avatar={
        definition.avatar && (
          <component.Slot
            definition={definition}
            listName="avatar"
            path={path}
            context={context}
            componentType={componentType}
          />
        )
      }
    />
  )
}

export default TitleBar
