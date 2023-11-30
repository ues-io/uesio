import { component, styles, definition } from "@uesio/ui"

const StyleDefaults = Object.freeze({
	root: [],
	header: [],
	left: [],
	content: [],
	right: [],
	footer: [],
})

type LayoutDefinition = {
	header?: definition.DefinitionList
	left?: definition.DefinitionList
	content?: definition.DefinitionList
	right?: definition.DefinitionList
	footer?: definition.DefinitionList
}

const Layout: definition.UC<LayoutDefinition> = (props) => {
	const { definition, context, componentType } = props
	const { header, left, content, right, footer } = definition

	const classes = styles.useStyleTokens(StyleDefaults, props)
	return (
		<div className={classes.root}>
			{header && (
				<div className={classes.header}>
					<component.Slot
						definition={definition}
						listName="header"
						path={props.path}
						context={context}
						componentType={componentType}
					/>
				</div>
			)}
			{left && (
				<div className={classes.left}>
					<component.Slot
						definition={definition}
						listName="left"
						path={props.path}
						context={context}
						componentType={componentType}
					/>
				</div>
			)}
			{content && (
				<div className={classes.content}>
					<component.Slot
						definition={definition}
						listName="content"
						path={props.path}
						context={context}
						componentType={componentType}
					/>
				</div>
			)}
			{right && (
				<div className={classes.right}>
					<component.Slot
						definition={definition}
						listName="right"
						path={props.path}
						context={context}
						componentType={componentType}
					/>
				</div>
			)}
			{footer && (
				<div className={classes.footer}>
					<component.Slot
						definition={definition}
						listName="footer"
						path={props.path}
						context={context}
						componentType={componentType}
					/>
				</div>
			)}
		</div>
	)
}

Layout.displayName = "Layout"

export default Layout
