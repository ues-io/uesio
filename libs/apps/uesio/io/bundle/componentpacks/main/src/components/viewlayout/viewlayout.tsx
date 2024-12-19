import { component, styles, definition } from "@uesio/ui"
import { ReactNode, useEffect, useRef, useState } from "react"

const StyleDefaults = Object.freeze({
	root: [],
	header: [],
	left: [],
	content: [],
	right: [],
	footer: [],
})

type ViewLayoutDefinition = {
	header?: definition.DefinitionList
	left?: definition.DefinitionList
	content?: definition.DefinitionList
	right?: definition.DefinitionList
	footer?: definition.DefinitionList
	trackScrolling?: boolean
}

const HeaderArea = (props: {
	trackScrolling: boolean
	className: string
	children: ReactNode
}) => {
	const { trackScrolling, className, children } = props
	const [direction, setDirection] = useState("scroll-down")

	const lastScrollY = useRef(0)

	useEffect(() => {
		if (!trackScrolling) return
		const container = document.querySelector("div#root")
		if (!container) return
		const handleScroll = () => {
			const currentScrollY = container.scrollTop
			setDirection(
				currentScrollY < lastScrollY.current
					? "scroll-up"
					: "scroll-down"
			)
			lastScrollY.current = currentScrollY
		}

		container.addEventListener("scroll", handleScroll)
		return () => container.removeEventListener("scroll", handleScroll)
	}, [trackScrolling])

	return <div className={styles.cx(className, direction)}>{children}</div>
}

const ViewLayout: definition.UC<ViewLayoutDefinition> = (props) => {
	const { definition, context, componentType } = props
	const {
		header,
		left,
		content,
		right,
		footer,
		trackScrolling = false,
	} = definition

	const classes = styles.useStyleTokens(StyleDefaults, props)
	return (
		<div className={classes.root}>
			{header && (
				<HeaderArea
					trackScrolling={trackScrolling}
					className={classes.header}
				>
					<component.Slot
						definition={definition}
						listName="header"
						path={props.path}
						context={context}
						componentType={componentType}
					/>
				</HeaderArea>
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

ViewLayout.displayName = "ViewLayout"

export default ViewLayout
