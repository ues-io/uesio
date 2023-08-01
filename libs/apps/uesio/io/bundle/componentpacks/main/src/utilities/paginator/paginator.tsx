import { definition, styles } from "@uesio/ui"
import Group from "../group/group"
import IconButton from "../iconbutton/iconbutton"

interface PaginatorUtilityProps {
	currentPage: number
	maxPages: number
	setPage: (page: number) => void
	loadMore?: () => Promise<void>
}

const StyleDefaults = Object.freeze({
	root: ["grid", "justify-items-center", "p-4"],
	pagebutton: [
		"inline-block",
		"rounded-full",
		"w-[28px]",
		"text-xs",
		"text-center",
		"leading-[28px]",
		"cursor-pointer",
		"text-slate-700",
	],
	currentpage: ["text-white", "cursor-default", "bg-primary"],
})

const Paginator: definition.UtilityComponent<PaginatorUtilityProps> = (
	props
) => {
	const { currentPage, maxPages, setPage, loadMore, context } = props
	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

	const page = currentPage >= maxPages ? maxPages - 1 : currentPage

	const nextPage = () => {
		if (page < maxPages - 1) setPage(page + 1)
	}

	const prevPage = () => {
		if (page > 0) setPage(page - 1)
	}

	const pageButtonCount = 5

	const displayStartPage = Math.max(
		0,
		Math.min(
			page - Math.floor(pageButtonCount / 2),
			maxPages - pageButtonCount
		)
	)

	const isLastPage = page >= maxPages - 1
	const showLoadMore = loadMore && isLastPage

	return (
		<nav aria-label="pagination" className={classes.root}>
			<Group context={context}>
				<IconButton
					icon="navigate_before"
					onClick={prevPage}
					context={context}
					disabled={page <= 0}
				/>
				{[...Array(pageButtonCount).keys()].map((index) => {
					const pageNum = index + displayStartPage
					if (pageNum >= maxPages) return null
					const isCurrent = pageNum === page

					return (
						<span
							key={pageNum}
							className={styles.cx(
								classes.pagebutton,
								isCurrent && classes.currentpage
							)}
							role="button"
							aria-current={isCurrent}
							aria-label={
								isCurrent
									? `Current Page, Page ${pageNum + 1}`
									: `Page ${pageNum + 1}`
							}
							onClick={
								!isCurrent ? () => setPage(pageNum) : undefined
							}
						>
							{pageNum + 1}
						</span>
					)
				})}

				{!showLoadMore && (
					<IconButton
						icon="navigate_next"
						onClick={nextPage}
						context={context}
						disabled={isLastPage}
					/>
				)}
				{showLoadMore && (
					<IconButton
						icon="file_download"
						onClick={async () => {
							if (loadMore) {
								await loadMore()
								setPage(page + 1)
							}
						}}
						context={context}
					/>
				)}
			</Group>
		</nav>
	)
}

export default Paginator
