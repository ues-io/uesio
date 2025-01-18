import { definition, styles } from "@uesio/ui"

type Props = {
  onClick?: (value: string) => void
  value: string
}

const StyleDefaults = Object.freeze({
  root: [
    "flex",
    "items-center",
    "py-1",
    "px-3",
    "mr-2",
    "text-xs",
    "font-semibold",
    "bg-slate-100",
    "hover:bg-slate-200",
    "rounded-3xl",
    "shadow-button",
  ],
  content: ["ml-1"],
})

const Pill: definition.UtilityComponent<Props> = (props) => {
  const { children, onClick, value } = props
  const classes = styles.useUtilityStyleTokens(StyleDefaults, props)
  return (
    <div
      className={classes.root}
      aria-label={value}
      onClick={() => onClick?.(value)}
    >
      <span className={classes.content}>{children}</span>
    </div>
  )
}
Pill.displayName = "Pill"

export default Pill
