import { FunctionComponent } from "react"
import { definition, styles, component } from "@uesio/ui"
import { IconButtonUtilityProps } from "../iconbutton/iconbutton"
import { GroupUtilityProps } from "../group/group"

interface PaginatorUtilityProps extends definition.UtilityProps {
	currentPage: number
	maxPages: number
	setPage: (page: number) => void
	loadMore?: () => Promise<void>
}

const IconButton = component.getUtility<IconButtonUtilityProps>(
	"uesio/io.iconbutton"
)
const Group = component.getUtility<GroupUtilityProps>("uesio/io.group")

const Paginator: FunctionComponent<PaginatorUtilityProps> = (props) => {
	const { currentPage, maxPages, setPage, loadMore, context } = props
	const classes = styles.useUtilityStyles(
		{
			root: {
				display: "grid",
				justifyItems: "center",
				padding: "16px",
			},
			pagebutton: {
				display: "inline-block",
				borderRadius: "50%",
				lineHeight: "28px",
				width: "28px",
				textAlign: "center",
				fontSize: "9pt",
				color: "#777",
				cursor: "pointer",
			},
			currentpage: {
				color: "white",
				cursor: "default",
				backgroundColor: context.getTheme().definition.colors.primary,
			},
		},
		props
	)

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
			<Group alignItems="center" context={context}>
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

export { PaginatorUtilityProps }

export default Paginator
