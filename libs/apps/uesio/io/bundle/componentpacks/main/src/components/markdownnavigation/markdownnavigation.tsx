import { styles, hooks, definition } from "@uesio/ui"

type Definition = {
	levels?: 1 | 2 | 3 | 4 | 5 | 6
	mdField?: string
	title?: string
}

interface Props extends definition.BaseProps {
	definition: Definition
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

const MarkdownNavigation: definition.UesioComponent<Props> = (props) => {
	const { definition, context } = props
	const uesio = hooks.useUesio(props)

	const classes = styles.useStyles(
		{
			root: {},
			title: {},
			nav: {},
			navItem: {},
		},
		props
	)
	const record = context.getRecord()
	const wire = context.getWire()
	if (!wire || !record) return null
	const value = uesio.file.useUserFile(
		context,
		record,
		definition.mdField || ""
	)

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

/*
const MarkdownNavigationPropertyDefinition: builder.BuildPropertiesDefinition =
	{
		title: "MarkdownNavigation",
		description: "Visible impression obtained by a camera",
		link: "https://docs.ues.io/",
		defaultDefinition: () => ({}),
		properties: [
			{
				name: "levels",
				type: "METADATA",
				metadataType: "FIELD",
				label: "Markdown source",
			},
			{
				name: "title",
				type: "TEXT",
				label: "Title",
			},
			{
				name: "levels",
				type: "NUMBER",
				label: "Levels",
			},
		],
		sections: [],
		//traits: ["uesio.standalone"],
		classes: ["root"],
		type: "component",
	}
*/

export default MarkdownNavigation
