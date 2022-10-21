import React, { FC } from "react"
import {
	useSelect,
	UseSelectStateChangeOptions,
	UseSelectState,
} from "downshift"
import type { Placement } from "@popperjs/core"
import { definition, styles, component } from "@uesio/ui"

type Item = { label: string; onSelect: () => void }
interface DropdownProps extends definition.UtilityProps {
	options: { label: string; onSelect: () => void }[]
	trigger: (isOpen: boolean) => FC<{ isOpen: boolean }>
	placement?: Placement
	onToggle?: (isOpen: boolean) => void
}
const Popper = component.getUtility("uesio/io.popper")

const Dropdown: FC<DropdownProps> = (props) => {
	function itemToString(item: Item) {
		return item ? item.label : ""
	}

	const classes = styles.useUtilityStyles(
		{
			root: { position: "relative" },
			triggerWrapper: {
				cursor: "pointer",
			},
			menu: {
				paddingLeft: 0,
				background: "#fff",
				overflow: "hidden",
				margin: 0,
				position: "absolute",
			},
			item: {
				listStyle: "none",
				cursor: "pointer",
			},
			itemHighlighted: {
				outline: "none",
			},
			itemLabel: {},
			menuAnimation: {},
		},
		props
	)

	// We want to prevent crashing the dom with calling functions that dont exist.
	const sanitizedOptions = props.options.map((o) => ({
		label: typeof o.label === "string" ? o.label : "unnamed",
		onSelect: typeof o.onSelect === "function" ? o.onSelect : () => null,
	}))

	const Select = () => {
		const [itemToFire, setItemToFire] = React.useState<
			Item | null | undefined
		>(null)
		React.useEffect(() => {
			itemToFire?.onSelect()
		}, [itemToFire])
		const stateReducer = (
			state: UseSelectState<Item>,
			actionAndChanges: UseSelectStateChangeOptions<Item>
		) => {
			const { type, changes } = actionAndChanges
			const { ItemClick, MenuKeyDownEnter, MenuBlur } =
				useSelect.stateChangeTypes
			switch (type) {
				case ItemClick:
				case MenuKeyDownEnter:
					// changes.selectedItem?.onSelect()
					setItemToFire(changes.selectedItem)
					return { selectedItem: props.options[0] }
				case MenuBlur:
					return { selectedItem: props.options[0] }
				default:
					return changes
			}
		}
		const {
			isOpen,
			getToggleButtonProps,
			getMenuProps,
			highlightedIndex,
			getItemProps,
		} = useSelect({
			items: sanitizedOptions,
			itemToString,
			stateReducer,
		})
		const [anchorEl, setAnchorEl] = React.useState<HTMLSpanElement | null>(
			null
		)
		return (
			<div className={classes.root}>
				<div
					className={classes.triggerWrapper}
					{...getToggleButtonProps()}
				>
					<span ref={setAnchorEl}>{props.trigger(isOpen)}</span>
				</div>

				{isOpen ? (
					<Popper
						referenceEl={anchorEl}
						context={props.context}
						placement={props.placement || "right-start"}
						offset={[0, 0]}
					>
						<ul {...getMenuProps()} className={classes.menu}>
							{props.options.map((item, index) => (
								<li
									className={styles.cx([
										classes.item,
										highlightedIndex === index &&
											classes.itemHighlighted,
									])}
									key={index}
									{...getItemProps({ item, index })}
								>
									<span className={classes.itemLabel}>
										{item.label}
									</span>
								</li>
							))}
						</ul>
					</Popper>
				) : (
					// According to a11y standards, we should always show at least the ul.
					<ul {...getMenuProps()} style={{ display: "none" }} />
				)}
			</div>
		)
	}

	return <Select />
}

Dropdown.displayName = "Dropdown"

export default Dropdown
