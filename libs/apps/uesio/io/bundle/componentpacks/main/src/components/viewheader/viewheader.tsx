import { component, styles, definition } from "@uesio/ui"
import { default as IOViewHeader } from "../../utilities/viewheader/viewheader"

const StyleDefaults = Object.freeze({
  root: [],
  logo: [],
  content: [],
  left: [],
  center: [],
  right: [],
  avatar: [],
})

type ViewHeaderDefinition = {
  logo?: definition.DefinitionList
  left?: definition.DefinitionList
  center?: definition.DefinitionList
  right?: definition.DefinitionList
  avatar?: definition.DefinitionList
}

const ViewHeader: definition.UC<ViewHeaderDefinition> = (props) => {
  const { definition, context, componentType } = props
  const { logo, left, center, right, avatar } = definition

  const classes = styles.useStyleTokens(StyleDefaults, props)
  return (
    <IOViewHeader
      classes={classes}
      context={context}
      logo={
        logo && (
          <component.Slot
            definition={definition}
            listName="logo"
            path={props.path}
            context={context}
            componentType={componentType}
          />
        )
      }
      left={
        left && (
          <component.Slot
            definition={definition}
            listName="left"
            path={props.path}
            context={context}
            componentType={componentType}
          />
        )
      }
      center={
        center && (
          <component.Slot
            definition={definition}
            listName="center"
            path={props.path}
            context={context}
            componentType={componentType}
          />
        )
      }
      right={
        right && (
          <component.Slot
            definition={definition}
            listName="right"
            path={props.path}
            context={context}
            componentType={componentType}
          />
        )
      }
      avatar={
        avatar && (
          <component.Slot
            definition={definition}
            listName="avatar"
            path={props.path}
            context={context}
            componentType={componentType}
          />
        )
      }
    />
  )
}

ViewHeader.displayName = "ViewHeader"

export default ViewHeader
