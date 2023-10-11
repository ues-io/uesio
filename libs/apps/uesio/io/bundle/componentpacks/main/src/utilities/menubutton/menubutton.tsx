import { ReactNode } from "react"
import { definition } from "@uesio/ui"

import Menu from "../menu/menu"
import IconButton from "../iconbutton/iconbutton"

interface MenuButtonUtilityProps<I> {
	itemRenderer: (item: I) => ReactNode
	onSelect: (item: I) => void
	getItemKey: (item: I) => string
	icon?: string
	fill?: boolean
	items: I[]
}

const MenuButton: definition.UtilityComponent<
	MenuButtonUtilityProps<unknown>
> = (props) => {
	const { context, icon, fill, items, itemRenderer, onSelect, getItemKey } =
		props

	return (
		<Menu
			context={context}
			onSelect={onSelect}
			itemRenderer={itemRenderer}
			items={items}
			getItemKey={getItemKey}
		>
			<IconButton
				className={props.className}
				context={context}
				icon={icon}
				fill={fill}
			/>
		</Menu>
	)
}

export type { MenuButtonUtilityProps }

export default MenuButton
