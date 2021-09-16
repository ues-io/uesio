import { FC, createContext } from "react"
import { component, styles } from "@uesio/ui"
import { LayoutProps } from "./layoutdefinition"
export const LayoutContext = createContext([0])

const IOLayout = component.registry.getUtility("io.layout")

const Layout: FC<LayoutProps> = (props) => {
	const {
		definition: {
			columnGap,
			justifyContent,
			alignItems,
			breakpoint,
			template,
		},
		context,
		path,
	} = props

	const mediaQueryForBreakpoint = breakpoint
		? {
				[`@media (max-width: ${breakpoint})`]: {
					flexFlow: "column",
				},
		  }
		: {}

	const classes = styles.useStyles(
		{
			root: {
				justifyContent: justifyContent || "initial",
				alignItems: alignItems || "initial",
				gap: columnGap || "initial",
				display: "flex",
				flexFlow: "row wrap",
				...mediaQueryForBreakpoint,
			},
		},
		props
	)

	return (
		<IOLayout classes={classes} {...props}>
			<LayoutContext.Provider value={template}>
				<component.Slot
					definition={props.definition}
					listName="columns"
					path={path}
					accepts={["io.column"]}
					context={context}
				/>
			</LayoutContext.Provider>
		</IOLayout>
	)
}

export default Layout
