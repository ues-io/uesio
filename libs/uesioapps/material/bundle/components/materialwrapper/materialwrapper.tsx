import React, { FunctionComponent } from "react"
import { MaterialWrapperProps } from "./materialwrapperdefinition"
import { component, material } from "@uesio/ui"
import { ThemeState } from "../../../../../ui/src/bands/theme/types"
import { PaletteOptions } from "@material-ui/core/styles/createPalette"
const makePaletteTheme = (theme: ThemeState): PaletteOptions =>
	Object.entries(theme?.definition?.palette || {}).reduce(
		(acc, [label, color]) => ({
			...acc,
			[label]: { main: color },
		}),
		{}
	)
const makeTheme = (theme: ThemeState) => {
	const themePalette = makePaletteTheme(theme)
	return material.createMuiTheme({
		palette: { ...themePalette },
	})
}
const Materialwrapper: FunctionComponent<MaterialWrapperProps> = (props) => (
	<material.ThemeProvider theme={makeTheme(props.context.getTheme())}>
		<material.CssBaseline />
		<component.Slot
			definition={props.definition}
			listName="components"
			path={props.path}
			accepts={["uesio.standalone"]}
			context={props.context}
		/>
	</material.ThemeProvider>
)

export default Materialwrapper
