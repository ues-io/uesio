import { definition, styles } from "@uesio/ui"

type Props = {
  description?: string
}

const StyleDefaults = Object.freeze({
  root: ["m-2"],
  title: ["grid", "align-middle", "mb-1", "grid-flow-col", "justify-between"],
  desc: ["text-xs", "font-light"],
})

const ItemTag: definition.UtilityComponent<Props> = (props) => {
  const { description, children } = props

  const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

  return (
    <div className={classes.root}>
      <div className={classes.title}>{children}</div>
      {description && <div className={classes.desc}>{description}</div>}
    </div>
  )
}

export default ItemTag
