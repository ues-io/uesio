import { definition, styles } from "@uesio/ui"
import Pill from "./pill"
import TextField from "../field/text"
import { useState } from "react"
import Button from "../button/button"
import Icon from "../icon/icon"

type Props = {
  onSelect?: (value: string) => void
  items: string[]
  onDelete?: (value: string) => void
  onAdd?: (value: string) => void
  addLabel?: string
}

const StyleDefaults = Object.freeze({
  root: [
    "flex",
    "gap-2",
    "flex-wrap",
    "items-center",
    "rounded",
    "p-1",
    "mx-2",
  ],
  remover: ["text-slate-700", "px-2", "cursor-pointer"],
  addWrapper: ["p-4"],
  pill: ["cursor-text"],
})

const PillBox: definition.UtilityComponent<Props> = (props) => {
  const { context, items, onAdd, onSelect, onDelete, addLabel = "Add" } = props
  const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

  const [showNewItem, setShowNewItem] = useState(false)

  return (
    <div className={classes.root}>
      {items.map((item) => (
        <Pill
          className={classes.pill}
          key={item}
          context={context}
          value={item}
          onClick={onSelect}
        >
          <span>{item}</span>
          {onDelete && (
            <button
              tabIndex={-1}
              className={classes.remover}
              type="button"
              onClick={(event) => {
                event.preventDefault() // Prevent the label from triggering
                event.stopPropagation()
                onDelete(item)
              }}
            >
              <Icon icon="close" context={context} />
            </button>
          )}
        </Pill>
      ))}
      {onAdd && !showNewItem && (
        <div className={classes.addWrapper}>
          <Button
            variant="uesio/builder.panelactionbutton"
            context={context}
            icon={<Icon context={context} icon="add" />}
            label={addLabel}
            onClick={() => setShowNewItem(true)}
          />
        </div>
      )}
      {onAdd && showNewItem && (
        <TextField
          context={context}
          mode="EDIT"
          focusOnRender
          applyChanges="onBlur"
          setValue={(value: string) => {
            setShowNewItem(false)
            onAdd?.(value)
          }}
        />
      )}
    </div>
  )
}
PillBox.displayName = "PillBox"

export default PillBox
