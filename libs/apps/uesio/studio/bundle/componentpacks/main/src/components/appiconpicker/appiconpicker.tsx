import { useEffect } from "react"
import { definition, styles, component } from "@uesio/ui"

type AppIconPickerDefinition = {
  fieldId: string
  colorFieldId: string
}

const APP_ICONS = [
  "circle",
  "change_history",
  "square",
  "pentagon",
  "hexagon",
  "favorite",
  "shield",
  "cloud",
  "star",
  "science",
  "work",
  "key",
  "eco",
  "bolt",
  "database",
  "spa",
  "water_drop",
  "person",
  "psychology",
  "pets",
  "health_and_safety",
  "recycling",
  "coronavirus",
  "bug_report",
  "gesture",
  "palette",
  "shopping_cart",
  "monitoring",
  "insights",
  "payments",
  "restaurant",
  "music_note",
  "local_shipping",
  "savings",
  "support_agent",
  "rocket_launch",
  "diamond",
  "forest",
  "cookie",
  "skull",
  "prescriptions",
  "barefoot",
  "playing_cards",
  "microbiology",
  "mist",
  "label",
  "fingerprint",
  "cardiology",
  "extension",
  "support",
  "interests",
  "code_blocks",
  "chat",
  "hub",
  "timer",
  "storefront",
  "factory",
  "warehouse",
  "traffic",
  "sailing",
  "school",
  "construction",
  "sports_soccer",
  "piano",
  "camping",
  "lunch_dining",
  "icecream",
  "travel",
  "coffee",
  "self_care",
  "skillet",
  "grocery",
]

const getRandomIcon = () =>
  APP_ICONS[Math.floor(Math.random() * APP_ICONS.length)]

const StyleDefaults = Object.freeze({
  root: [
    "leading-none",
    "grid",
    "grid-cols-12",
    "cursor-pointer",
    "gap-y-1.5",
    "justify-items-center",
  ],
  iconwrapper: ["grid", "relative", "transition-all", "border-transparent"],
  iconwrapperSelected: [
    "before:rounded-full",
    "before:absolute",
    "before:h-8",
    "before:w-8",
    "before:border-[5px]",
    "before:border-inherit",
    "before:-z-10",
    "before:top-1/2",
    "before:-translate-y-1/2",
    "before:left-1/2",
    "before:-translate-x-1/2",
  ],
  icon: ["text-base", "text-slate-700"],
  iconSelected: ["text-inherit"],
})

const AppIconPicker: definition.UC<AppIconPickerDefinition> = (props) => {
  const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")
  const Icon = component.getUtility("uesio/io.icon")
  const {
    context,
    definition: { fieldId, colorFieldId },
  } = props

  const record = context.getRecord()
  const wire = context.getWire()

  const iconValue = record?.getFieldValue(fieldId)
  const color = record?.getFieldValue(colorFieldId) as string

  useEffect(() => {
    if (!iconValue) {
      // Update to a random color if we haven't set one.
      record?.update(fieldId, getRandomIcon(), context)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldId, iconValue])

  if (!wire || !record) throw new Error("Record context not provided")

  const collection = wire.getCollection()
  const fieldMetadata = collection.getField(fieldId)
  const colorFieldMetadata = collection.getField(colorFieldId)

  if (!fieldMetadata || !colorFieldMetadata)
    throw new Error("Invalid icon field or color field")

  const classes = styles.useStyleTokens(StyleDefaults, props)

  return (
    <FieldWrapper
      label={"Icon"}
      context={context}
      wire={wire}
      record={record}
      fieldId={fieldId}
    >
      <div className={classes.root}>
        {APP_ICONS.map((icon, index) => {
          const isSelected = iconValue === icon
          return (
            <div
              key={index}
              className={styles.process(
                context,
                classes.iconwrapper,
                isSelected && `border-[${color}]`,
                isSelected && `text-[${color}]`,
                isSelected && classes.iconwrapperSelected,
              )}
              onClick={() => {
                record.update(fieldId, icon, context)
              }}
            >
              <Icon
                className={styles.cx(
                  classes.icon,
                  isSelected && classes.iconSelected,
                )}
                icon={icon}
                context={context}
              />
            </div>
          )
        })}
      </div>
    </FieldWrapper>
  )
}

export default AppIconPicker
