import { definition, wire, signal } from "@uesio/ui"

export type SeriesDefinition = {
	name: string
	label: string
	field: string
	wire: string
	options: Record<string, unknown>
}

export type ChartDefinition = {
	xAxis?: {
		wire: string
		field: string
	}
	options?: Record<string, unknown>
	title?: string
	signals?: signal.SignalDefinition[]
	series?: SeriesDefinition[]
} & definition.BaseDefinition

// IDEA: We should have way to have Chart coloring handled in the Theme
// Chromajs seems to have some API's for this
// https://gka.github.io/palettes/#/9|d|00429d,96ffea,ffffe0|ffffe0,ff005e,93003a|1|1
export const CHART_COLORS = {
	red: "rgb(255, 99, 132)",
	orange: "rgb(255, 159, 64)",
	yellow: "rgb(255, 205, 86)",
	green: "rgb(75, 192, 192)",
	blue: "rgb(54, 162, 235)",
	purple: "rgb(153, 102, 255)",
	grey: "rgb(201, 203, 207)",
}

// The class below isn't very usefull. The idea is this will grow with helper functions (like date handling/localizing)
// IDEA: add definition as function param to provide handy functions now handled in component
// IDEA: integrate with date library.
export class Chart {
	constructor(wires: Record<string, wire.Wire>) {
		this.wires = wires
	}
	wires: Record<string, wire.Wire>
	aggregateFieldValue = (w?: string, f?: string) =>
		w && f ? this.wires[w].getData().map((rec) => rec.getFieldValue(f)) : []
}
