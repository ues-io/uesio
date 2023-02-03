import { FunctionComponent, ReactNode } from "react"
import { useCombobox } from "downshift"
import { definition, styles } from "@uesio/ui"
import Icon from "../icon/icon"
import {
	autoPlacement,
	useFloating,
	autoUpdate,
	offset,
	FloatingPortal,
} from "@floating-ui/react"

type CustomSelectProps<T> = {
	value: T
	setValue: (value: T) => void
	items: T[]
	itemToString: (item: T) => string
	allowSearch?: true
	itemRenderer: (
		item: T,
		index: number,
		highlightedIndex: number
	) => ReactNode
	tagRenderer: (item: T) => ReactNode
} & definition.BaseProps

const CustomSelect: FunctionComponent<CustomSelectProps<unknown>> = (props) => {
	const {
		allowSearch = true,
		items = [],
		setValue,
		value,
		itemToString,
		itemRenderer = (item) => <div>{itemToString(item)}</div>,
		tagRenderer = (item) => <div>{itemToString(item)}</div>,
		context,
	} = props

	const classes = styles.useUtilityStyles(
		{
			root: {},
			input: {},
			readonly: {},
			menu: {},
			menuitem: {},
			editbutton: {},
			displayarea: {},
			searchbox: {},
		},
		props,
		"uesio/io.customselectfield"
	)

	const {
		isOpen,
		getMenuProps,
		getComboboxProps,
		getLabelProps,
		highlightedIndex,
		getItemProps,
		getInputProps,
		inputValue,
		openMenu,
	} = useCombobox({
		items,
		selectedItem: value || "",
		onSelectedItemChange: (changes) => {
			const selectedItem = changes.selectedItem
			selectedItem && setValue(selectedItem)
		},
	})

	const { x, y, strategy, refs } = useFloating({
		placement: "bottom-start",
		middleware: [
			offset(2),
			autoPlacement({ allowedPlacements: ["top-start", "bottom-start"] }),
		],
		whileElementsMounted: autoUpdate,
	})

	return (
		<div className={classes.root} ref={refs.setReference}>
			<div onClick={() => openMenu()} className={classes.input}>
				<div
					onFocus={openMenu}
					tabIndex={isOpen ? -1 : 0}
					className={classes.displayarea}
				>
					{tagRenderer}
				</div>

				<button className={classes.editbutton} type="button">
					<Icon icon="expand_more" context={context} />
				</button>
			</div>
			<FloatingPortal>
				<div
					ref={refs.setFloating}
					style={{
						...(!isOpen && { visibility: "hidden" }),
						position: strategy,
						top: y ?? 0,
						left: x ?? 0,
						width: "max-content",
					}}
					className={classes.menu}
				>
					<div {...getMenuProps()}>
						<div {...getComboboxProps()}>
							<label {...getLabelProps()}>
								<input
									type="text"
									//autoFocus
									className={classes.searchbox}
									placeholder="Search..."
									style={{
										display: allowSearch ? "auto" : "none",
									}}
									{...getInputProps()}
								/>
							</label>
						</div>
						{items.map((item: string, index) => {
							// hacky, but downshift needs the index in order to determine what element this is.
							// That's why we can't filter the items array beforehand.
							if (allowSearch && !item.includes(inputValue))
								return null
							return (
								<div
									className={classes.menuitem}
									key={index}
									{...getItemProps({
										item,
										index,
									})}
								>
									{itemRenderer(
										item,
										index,
										highlightedIndex
									)}
								</div>
							)
						})}
					</div>
				</div>
			</FloatingPortal>
		</div>
	)
}

export default CustomSelect
