import { useState, ReactNode, useRef } from "react"
import { definition, styles } from "@uesio/ui"
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

interface MenuButtonUtilityProps<T> {
	itemRenderer: (item: T) => ReactNode
	onSelect: (item: T) => void
	items: T[]
	getItemKey: (item: T) => string
	onSearch?: (search: string) => void
	searchFilter?: (item: T, search: string) => boolean
	closeOnSelect?: boolean
	open?: boolean
}

const StyleDefaults = Object.freeze({
	root: [],
	menu: [],
	menuheader: [],
	menuitem: [],
	highlighted: [],
	searchbox: [],
	itemsarea: [],
})

const NoStyle = Object.freeze(
	Object.fromEntries(Object.keys(StyleDefaults).map((key) => [key, ""]))
)

const ListMenu: definition.UtilityComponent<MenuButtonUtilityProps<unknown>> = (
	props
) => {
	const [isOpen, setIsOpen] = useState(props.open || false)
	const [searchText, setSearchText] = useState("")

	const classes = isOpen
		? styles.useUtilityStyleTokens(
				StyleDefaults,
				props,
				"uesio/io.listmenu"
			)
		: NoStyle

	const getSearchItems = (searchText: string) => {
		onSearch?.(searchText)
		setSearchText(searchText)
	}

	const onOpenChange = (open: boolean) => {
		if (open) {
			getSearchItems(searchText)
		}
		setIsOpen(open)
	}

	const floating = useFloating({
		open: isOpen,
		onOpenChange,
		placement: "bottom-start",
		middleware: [
			offset(2),
			autoPlacement({
				allowedPlacements: [
					"top-start",
					"bottom-start",
					"bottom-start",
					"bottom-end",
				],
			}),
		],
		whileElementsMounted: autoUpdate,
	})

	const { floatingStyles, refs } = floating

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
		focusItemOnHover: false,
	})

	const { getReferenceProps, getFloatingProps, getItemProps } =
		useInteractions([click, dismiss, role, listNavigation])

	const {
		context,
		items,
		itemRenderer,
		onSelect,
		onSearch,
		searchFilter,
		getItemKey,
		children,
		closeOnSelect = true,
		id,
	} = props

	return (
		<>
			<div
				className="flex"
				tabIndex={0}
				id={id}
				ref={refs.setReference}
				{...getReferenceProps({
					onClick: (e) => {
						e.stopPropagation()
						e.preventDefault()
					},
				})}
			>
				{children}
			</div>

			{isOpen && (
				<FloatingPortal>
					<FloatingFocusManager
						context={floating.context}
						modal={false}
					>
						<div
							ref={refs.setFloating}
							style={floatingStyles}
							className={classes.menu}
							{...getFloatingProps()}
						>
							<div
								id={`floatingMenu-${id}`}
								className={classes.menuheader}
							>
								{(onSearch || searchFilter) && (
									<input
										type="text"
										value={searchText}
										autoFocus
										className={classes.searchbox}
										placeholder={`${context.getLabel(
											"uesio/io.search"
										)}...`}
										onChange={(e) => {
											getSearchItems(e.target.value)
										}}
									/>
								)}
							</div>
							<div className={classes.itemsarea}>
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
												onClick(event) {
													event.preventDefault()
													event.stopPropagation()
													onSelect(item)
													closeOnSelect &&
														setIsOpen(false)
												},
												// Handle keyboard select.
												onKeyDown(event) {
													if (event.key === "Enter") {
														event.preventDefault()
														event.stopPropagation()
														onSelect(item)
														closeOnSelect &&
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
				</FloatingPortal>
			)}
		</>
	)
}

export default ListMenu
