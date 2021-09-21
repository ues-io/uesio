import { FC, useState } from "react"
import { definition, styles, component, util, hooks } from "@uesio/ui"
import FormSection from "./formsection"
import { getColumnFlexStyles } from "../io.column/column"
import { FormSectionProps } from "./formsectiondefinition"

const BuildWrapper = component.registry.getUtility("studio.buildwrapper")
const FormSectionBuilder: FC<FormSectionProps> = (props) => {
	const { path = "", context } = props

	// Get template val set on parent layout def
	const layoutOverrides = (() => {
		if (!path) return {}
		const pathArray = component.path.fromArray(path)

		const pathToLayout = pathArray.slice(0, -3)
		const layoutDef = context.getInViewDef(pathToLayout) as any
		if (!layoutDef.template) return {}
		const template = layoutDef.template

		return getColumnFlexStyles(template, path)
	})()

	const classes = styles.useStyles(
		{
			root: {
				...layoutOverrides,
				flex: "100%",
				gap: "inherit",
			},
		},
		{
			context: props.context,
		}
	)

	return (
		<BuildWrapper {...props} className={classes.root}>
			<FormSection {...props} />
		</BuildWrapper>
	)
}

export default FormSectionBuilder
