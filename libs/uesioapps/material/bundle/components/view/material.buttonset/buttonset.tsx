import React, { FunctionComponent } from "react"
import { component, styles } from "@uesio/ui"
import { ButtonSetProps } from "./buttonsetdefinition"

const useStyles = styles.getUseStyles(["root"])

const ButtonSet: FunctionComponent<ButtonSetProps> = (
	props: ButtonSetProps
) => {
	const { definition, path, context } = props
	const classes = useStyles(props)
	return (
		<div className={classes.root}>
			<component.Slot
				definition={definition}
				listName="buttons"
				path={path}
				accepts={["material.button"]}
				direction="horizontal"
				context={context}
			/>
		</div>
	)
}

export default ButtonSet
