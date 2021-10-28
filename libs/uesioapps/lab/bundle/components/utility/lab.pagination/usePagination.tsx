import { styles, component, context } from "@uesio/ui"
import { FC, useState } from "react"

const Icon = component.registry.getUtility("io.icon")

interface IUsePagination<Y> {
	itemsPerPage: number
	records?: Y[]
	context: context.Context
}

export const usePagination = <T extends unknown>({
	itemsPerPage,
	records,
	context,
}: IUsePagination<T>) => {
	const [currentPage, setCurrentPage] = useState(1)
	const [currentOffset, setCurrentOffset] = useState(0)

	const classes = styles.useStyles(
		{
			root: {
				marginBottom: "1em",
			},
			pageNumber: {
				borderBottom: "3px solid pink",
				margin: "0 2em",
				padding: "0 0.5em",
			},
		},
		{
			context,
		}
	)

	const activeRecords =
		records && records.slice(currentOffset, currentOffset + itemsPerPage)
	const lastPage = records && Math.floor(records.length / itemsPerPage)

	const onPageStep = (direction: "next" | "prev") => {
		const pages = {
			next: currentPage + 1,
			prev: currentPage === 1 ? 1 : currentPage - 1,
		}
		const newPage = pages[direction]
		setCurrentPage(newPage)
		setCurrentOffset((newPage - 1) * itemsPerPage)
	}

	const PaginationNavigation: FC = () => {
		if (!records || records.length < itemsPerPage + 1) return <span />
		return (
			<nav aria-label="pagination" className={classes.root}>
				<button
					disabled={currentPage === 1}
					onClick={() => onPageStep("prev")}
				>
					<Icon context={context} icon="chevron_left" />
				</button>

				<span className={classes.pageNumber} aria-current="page">
					{currentPage}
				</span>

				<button
					disabled={currentPage === lastPage}
					onClick={() => onPageStep("next")}
				>
					<Icon context={context} icon="chevron_right" />
				</button>
			</nav>
		)
	}

	return {
		currentPage,
		currentOffset,
		activeRecords,
		onPageStep,
		lastPage,
		PaginationNavigation,
	}
}
