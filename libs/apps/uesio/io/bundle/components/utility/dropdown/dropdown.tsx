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
	trigger: React.ReactElement
	placement?: Placement
}
const Popper = component.getUtility("uesio/io.popper")

const Dropdown: FC<DropdownProps> = (props) => {
	function itemToString(item: Item) {
		return item ? item.label : ""
	}

	const classes = styles.useUtilityStyles(
		{
			root: { position: "relative" },
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

	const Select = () => {
		const {
			// isOpen,
			getToggleButtonProps,
			getMenuProps,
			highlightedIndex,
			getItemProps,
		} = useSelect({
			items: sanitizedOptions,
			itemToString,
			stateReducer,
		})
		const [anchorEl, setAnchorEl] = React.useState<HTMLDivElement | null>(
			null
		)

		const isOpen = true

		return (
			<div ref={setAnchorEl} className={classes.root}>
				<span
					classes={classes.triggerWrapper}
					{...getToggleButtonProps()}
				>
					{props.trigger}
				</span>

				{isOpen ? (
					<Popper
						referenceEl={anchorEl}
						context={props.context}
						placement={props.placement || "right-start"}
						useFirstRelativeParent
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
					<ul {...getMenuProps()} />
				)}
			</div>
		)
	}

	return <Select />
}

export default Dropdown
