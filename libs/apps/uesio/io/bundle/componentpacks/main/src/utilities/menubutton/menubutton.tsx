import { FunctionComponent, useState, ReactNode } from "react"
import { definition, component, styles } from "@uesio/ui"
import { useSelect } from "downshift"

interface MenuButtonUtilityProps<I> extends definition.UtilityProps {
	itemRenderer: (item: I) => ReactNode
	onSelect?: (item: I) => void
	icon?: string
	fill?: boolean
	items: I[]
}

const IconButton = component.getUtility("uesio/io.iconbutton")
const Popper = component.getUtility("uesio/io.popper")

const MenuButton: FunctionComponent<MenuButtonUtilityProps<unknown>> = (
	props
) => {
	const { context, icon, fill, items, itemRenderer, onSelect } = props

	const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)

	const classes = styles.useUtilityStyles(
		{
			menu: {
				backgroundColor: "white",
				border: "1px solid #ddd",
				borderRadius: "6px",
				listStyleType: "none",
				padding: "0px",
				"&.hidden": {
					visibility: "hidden",
				},
			},
			menuitem: {
				padding: "8px",
				fontSize: "10pt",
				"&.highlighted": {
					backgroundColor: "#f0f0f0",
					cursor: "pointer",
				},
			},
		},
		props
	)

	const {
		isOpen,
		getToggleButtonProps,
		getMenuProps,
		highlightedIndex,
		getItemProps,
	} = useSelect({
		items,
		onSelectedItemChange: ({ selectedItem: newSelectedItem }) =>
			onSelect?.(newSelectedItem),
	})

	return (
		<div ref={setAnchorEl}>
			<div {...getToggleButtonProps()}>
				<IconButton
					className={props.className}
					context={context}
					icon={icon}
					fill={fill}
				/>
			</div>
			<Popper
				referenceEl={anchorEl}
				context={props.context}
				placement={"bottom-start"}
				offset={[0, -12]}
			>
				<ul
					className={styles.cx(classes.menu, !isOpen && "hidden")}
					{...getMenuProps()}
				>
					{isOpen &&
						items.map((item, index) => (
							<li
								className={styles.cx(
									classes.menuitem,
									highlightedIndex === index && "highlighted"
								)}
								{...getItemProps({ item, index })}
								key={index}
							>
								{itemRenderer(item)}
							</li>
						))}
				</ul>
			</Popper>
		</div>
	)
}

export { MenuButtonUtilityProps }

export default MenuButton
