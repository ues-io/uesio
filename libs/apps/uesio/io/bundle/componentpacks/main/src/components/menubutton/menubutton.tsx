import { definition, signal, metadata, api } from "@uesio/ui"
import { default as IOMenuButton } from "../../utilities/menubutton/menubutton"

type MenuItemDefinition = {
  id: string
  label: string
  signals?: signal.SignalDefinition[]
}

type MenuButtonDefinition = {
  icon?: string
  items: MenuItemDefinition[]
  buttonVariant?: metadata.MetadataKey
}

const MenuButton: definition.UC<MenuButtonDefinition> = (props) => {
  const { definition, context } = props

  const { items, icon, buttonVariant } = definition

  return (
    <IOMenuButton
      itemRenderer={(item: MenuItemDefinition) => item.label}
      items={items}
      onSelect={(item: MenuItemDefinition) => {
        if (!item.signals) return
        api.signal.runMany(item.signals, context)
      }}
      getItemKey={(item: MenuItemDefinition) => item.id}
      icon={icon}
      context={context}
      buttonVariant={buttonVariant}
    />
  )
}

export default MenuButton
