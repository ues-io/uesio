import { styles, api, definition } from "@uesio/ui"
import { UserFileMetadata } from "../field/field"

type Definition = {
	levels?: 1 | 2 | 3 | 4 | 5 | 6
	mdField?: string
	title?: string
}

const getHeadingOverview = (mdValue: string, level: 1 | 2 | 3 | 4 | 5 | 6) => {
	const regXHeader = /(?<flag>#{1,6})\s+(?<content>.+)/g
	// Create workable objects to render tiles from + remove h1 heading
	return mdValue
		.match(regXHeader)
		?.map((el) => {
			const content = el.replace(/^(#{1,6})\s+/, "")
			const number = el.match(/#/g)?.length || 1
			if (number > level) return null
			return {
				heading: number,
				content,
				id: content
					.toLowerCase()
					.replace(/ /g, "-")
					.replace(/[^\w-]+/g, ""),
			}
		})
		.filter((el) => el && el.heading !== 1) as {
		heading: number
		content: string
		id: string
	}[]
}

const StyleDefaults = Object.freeze({
	root: [],
	title: [],
	nav: [],
	navItem: [],
})

const MarkdownNavigation: definition.UC<Definition> = (props) => {
	const { definition, context } = props

	const classes = styles.useStyleTokens(StyleDefaults, props)
	const record = context.getRecord()
	const wire = context.getWire()
	if (!wire || !record) return null
	const userFile = record.getFieldValue(
		definition.mdField || ""
	) as UserFileMetadata
	if (!userFile) return null
	const value = api.file.useUserFile(context, userFile)

	const headingOverview =
		getHeadingOverview(String(value), definition.levels || 3) || []

	return headingOverview.length > 0 ? (
		<div className={classes.root}>
			<p className={classes.title}>{definition.title || "Content"}</p>
			<nav className={classes.nav}>
				{headingOverview.map((el) => (
					<div
						key={el.heading}
						className={classes.navItem}
						style={{
							paddingLeft: (el.heading - 1) * 5 + "px",
						}}
					>
						<a
							href={"#" + el.id}
							onClick={(e) => {
								e.preventDefault()
								document
									.querySelector("#" + el.id)
									?.scrollIntoView({
										behavior: "smooth",
									})
							}}
						>
							{el.content}
						</a>
					</div>
				))}
			</nav>
		</div>
	) : null
}

export default MarkdownNavigation
