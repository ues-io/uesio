import { FC, useState } from "react"
import { definition, styles, component, util, hooks } from "@uesio/ui"
import FormSection from "./formsection"
import { getColumnFlexStyles } from "../lab.column/column"
import { FormSectionProps } from "./formsectiondefinition"

const BuildWrapper = component.registry.getUtility("studio.buildwrapper")
const FormSectionBuilder: FC<FormSectionProps> = (props) => {
	const classes = styles.useStyles(
		{
			root: {
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
