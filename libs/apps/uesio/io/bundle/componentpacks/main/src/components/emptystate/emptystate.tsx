import { styles, definition } from "@uesio/ui"

import Icon from "../../utilities/icon/icon"

type EmptyStateDefinition = {
  title?: string
  subtitle?: string
  icon?: string
  iconFill?: boolean
}

const StyleDefaults = Object.freeze({
  root: [],
  title: [],
  subtitle: [],
  icon: [],
})

const EmptyState: definition.UC<EmptyStateDefinition> = (props) => {
  const { definition, context } = props
  const classes = styles.useStyleTokens(StyleDefaults, props)

  const { title, subtitle, icon, iconFill } = definition

  return (
    <div className={classes.root}>
      <Icon
        classes={{
          root: classes.icon,
        }}
        fill={iconFill}
        context={context}
        icon={context.mergeString(icon)}
      />
      <div className={classes.title}>{context.mergeString(title)}</div>
      <div className={classes.subtitle}>{context.mergeString(subtitle)}</div>
    </div>
  )
}

export default EmptyState
