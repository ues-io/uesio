import { FunctionComponent } from "react"
import { definition, styles, component } from "@uesio/ui"
import { IconButtonUtilityProps } from "../io.iconbutton/iconbutton"
import { GroupUtilityProps } from "../io.group/group"

interface PaginatorUtilityProps extends definition.UtilityProps {
	currentPage: number
	maxPages: number
	setPage: (page: number) => void
}

const IconButton =
	component.registry.getUtility<IconButtonUtilityProps>("io.iconbutton")
const Group = component.registry.getUtility<GroupUtilityProps>("io.group")

const Paginator: FunctionComponent<PaginatorUtilityProps> = (props) => {
	const { currentPage, maxPages, setPage, context } = props
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
				backgroundColor: context.getTheme().definition.palette.primary,
			},
		},
		props
	)

	const nextPage = () => {
		if (currentPage < maxPages - 1) setPage(currentPage + 1)
	}

	const prevPage = () => {
		if (currentPage > 0) setPage(currentPage - 1)
	}

	const pageButtonCount = 5

	const displayStartPage = Math.max(
		0,
		Math.min(
			currentPage - Math.floor(pageButtonCount / 2),
			maxPages - pageButtonCount
		)
	)

	return (
		<div className={classes.root}>
			<Group alignItems="center" context={context}>
				<IconButton
					icon="navigate_before"
					onClick={prevPage}
					context={context}
					disabled={currentPage <= 0}
				/>
				{[...Array(pageButtonCount).keys()].map((index) => {
					const pageNum = index + displayStartPage
					if (pageNum >= maxPages) return null
					const isCurrent = pageNum === currentPage

					return (
						<div
							className={styles.cx(
								classes.pagebutton,
								isCurrent && classes.currentpage
							)}
							onClick={
								!isCurrent ? () => setPage(pageNum) : undefined
							}
						>
							{pageNum + 1}
						</div>
					)
				})}

				<IconButton
					icon="navigate_next"
					onClick={nextPage}
					context={context}
					disabled={currentPage >= maxPages - 1}
				/>
			</Group>
		</div>
	)
}

export { PaginatorUtilityProps }

export default Paginator
