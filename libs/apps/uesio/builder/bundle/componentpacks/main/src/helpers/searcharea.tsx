import { definition, styles } from "@uesio/ui"
import { ReactNode } from "react"

interface Props {
  id?: string
  placeholder?: string
  searchTerm: string | undefined
  setSearchTerm: (searchTerm: string) => void
  onSelect?: (value: string) => void
  actions?: ReactNode
}

const StyleDefaults = Object.freeze({
  root: [
    "flex",
    "p-2",
    "relative",
    "align-center",
    "gap-2",
    "bg-panel_header_bg_color",
  ],
  input: [
    "grow",
    "text-xs",
    "px-2",
    "py-1.5",
    "font-light",
    "rounded",
    "border-1",
    "border-searchbox_border_color",
    "text-searchbox_text_color",
    "bg-searchbox_bg_color",
    "outline-offset-0",
    "placeholder:text-searchbox_placeholder_text_color",
  ],
  actions: ["grow-0"],
})

const SearchArea: definition.UtilityComponent<Props> = (props) => {
  const {
    context,
    id,
    searchTerm,
    setSearchTerm,
    actions,
    onSelect,
    placeholder,
  } = props

  const classes = styles.useUtilityStyleTokens(StyleDefaults, props)
  return (
    <div className={classes.root}>
      <input
        autoFocus
        className={classes.input}
        id={id}
        value={searchTerm || ""}
        onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
        type="search"
        placeholder={placeholder || `${context.getLabel("uesio/io.search")}...`}
        onKeyPress={(e) => {
          if (e.key === "Enter" && onSelect) {
            e.preventDefault()
            e.stopPropagation()
            onSelect(e.currentTarget.value)
          }
        }}
      />
      {actions && <div className={classes.actions}>{actions}</div>}
    </div>
  )
}

export default SearchArea
