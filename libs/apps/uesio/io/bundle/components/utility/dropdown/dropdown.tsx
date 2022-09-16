import React, { FC } from "react"
import {
	useSelect,
	UseSelectStateChangeOptions,
	UseSelectState,
} from "downshift"
import { definition, styles } from "@uesio/ui"

type Item = { label: string; onSelect: () => void }
interface DropdownProps extends definition.UtilityProps {
	onSelect: () => void
	options: { label: string; onSelect: () => void }[]
	TriggerElement: React.ReactElement
}

const Dropdown: FC<DropdownProps> = (props) => {
	function itemToString(item: Item) {
		return item ? item.label : ""
	}

	const classes = styles.useUtilityStyles(
		{
			root: {},
			triggerWrapper: {},
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
				changes.selectedItem?.onSelect()
				return { selectedItem: props.options[0] }
			case MenuBlur:
				return { selectedItem: props.options[0] }
			default:
				return changes
		}
	}

	function Select() {
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

		return (
			<div className={classes.root}>
				<span
					classes={classes.triggerWrapper}
					{...getToggleButtonProps()}
				>
					{props.TriggerElement}
				</span>

				<ul {...getMenuProps()} className={classes.menu}>
					{isOpen &&
						props.options.map((item, index) => (
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
			</div>
		)
	}

	return <Select />
}

export default Dropdown
