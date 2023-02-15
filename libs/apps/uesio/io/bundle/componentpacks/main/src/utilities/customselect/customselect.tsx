import { FunctionComponent, ReactNode, useRef, useState } from "react"
import { definition, styles } from "@uesio/ui"
import Icon from "../icon/icon"
import {
	autoPlacement,
	useFloating,
	autoUpdate,
	offset,
	FloatingPortal,
	useListNavigation,
	useInteractions,
	useDismiss,
	useClick,
	useRole,
	FloatingFocusManager,
} from "@floating-ui/react"

type CustomSelectProps<T> = {
	onSelect: (item: T) => void
	onUnSelect: (item: T) => void
	items: T[] | undefined
	isSelected: (item: T) => boolean
	getItemKey: (item: T) => string
	onSearch?: (search: string) => void
	searchFilter?: (item: T, search: string) => boolean
	itemRenderer: (item: T) => ReactNode
} & definition.BaseProps

const CustomSelect: FunctionComponent<CustomSelectProps<unknown>> = (props) => {
	const {
		onSearch,
		searchFilter,
		isSelected,
		getItemKey,
		items = [],
		onSelect,
		onUnSelect,
		itemRenderer,
		context,
	} = props

	const classes = styles.useUtilityStyles(
		{
			root: {},
			menu: {},
			menuitem: {},
			notfound: {},
			editbutton: {},
			selecteditemwrapper: {},
			highlighted: {},
			searchbox: {},
		},
		props,
		"uesio/io.customselectfield"
	)

	const [isOpen, setIsOpen] = useState(false)
	const [searchText, setSearchText] = useState("")

	const floating = useFloating({
		open: isOpen,
		onOpenChange: setIsOpen,
		placement: "bottom-start",
		middleware: [
			offset(2),
			autoPlacement({ allowedPlacements: ["top-start", "bottom-start"] }),
		],
		whileElementsMounted: autoUpdate,
	})

	const { x, y, strategy, refs } = floating

	const listRef = useRef<(HTMLDivElement | null)[]>([])

	const [activeIndex, setActiveIndex] = useState<number | null>(null)

	const dismiss = useDismiss(floating.context)
	const click = useClick(floating.context)
	const role = useRole(floating.context, { role: "listbox" })

	const listNavigation = useListNavigation(floating.context, {
		listRef,
		activeIndex,
		onNavigate: setActiveIndex,
		focusItemOnOpen: false,
	})

	const { getReferenceProps, getFloatingProps, getItemProps } =
		useInteractions([click, dismiss, role, listNavigation])

	const selectedItems = items ? items.filter(isSelected) : []

	return (
		<>
			<div
				tabIndex={0}
				className={classes.root}
				ref={refs.setReference}
				{...getReferenceProps()}
			>
				<div>
					{!selectedItems.length && (
						<div className={classes.notfound}>Nothing Selected</div>
					)}
					{selectedItems.map((item) => (
						<div
							key={getItemKey(item)}
							className={classes.selecteditemwrapper}
						>
							{itemRenderer(item)}
							<button
								tabIndex={-1}
								className={classes.editbutton}
								type="button"
								onClick={(event) => {
									event.preventDefault() // Prevent the label from triggering
									onUnSelect(item)
								}}
							>
								<Icon icon="close" context={context} />
							</button>
						</div>
					))}
				</div>
				<button
					tabIndex={-1}
					className={classes.editbutton}
					type="button"
				>
					<Icon icon="expand_more" context={context} />
				</button>
			</div>
			<FloatingPortal>
				{isOpen && (
					<FloatingFocusManager
						context={floating.context}
						modal={false}
					>
						<div
							ref={refs.setFloating}
							style={{
								position: strategy,
								top: y ?? 0,
								left: x ?? 0,
							}}
							className={classes.menu}
							{...getFloatingProps()}
						>
							<div>
								{(onSearch || searchFilter) && (
									<input
										type="text"
										value={searchText}
										autoFocus
										className={classes.searchbox}
										placeholder="Search..."
										onChange={(e) => {
											onSearch?.(e.target.value)
											setSearchText(e.target.value)
										}}
									/>
								)}
								{items
									.filter((item) => {
										if (!searchFilter) return true
										if (!searchText) return true
										return searchFilter(item, searchText)
									})
									.map((item, index) => (
										<div
											className={styles.cx(
												classes.menuitem,
												activeIndex === index &&
													classes.highlighted
											)}
											key={getItemKey(item)}
											tabIndex={
												activeIndex === index ? 0 : -1
											}
											ref={(node) => {
												listRef.current[index] = node
											}}
											role="option"
											{...getItemProps({
												// Handle pointer select.
												onClick() {
													onSelect(item)
													setIsOpen(false)
												},
												// Handle keyboard select.
												onKeyDown(event) {
													if (event.key === "Enter") {
														event.preventDefault()
														onSelect(item)
														setIsOpen(false)
													}
												},
											})}
										>
											{itemRenderer(item)}
										</div>
									))}
							</div>
						</div>
					</FloatingFocusManager>
				)}
			</FloatingPortal>
		</>
	)
}

export default CustomSelect
