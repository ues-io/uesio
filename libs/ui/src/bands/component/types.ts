type PlainComponentState =
	| {
			[key: string]: string | boolean | number
	  }
	| string
	| boolean
	| number

type ComponentState = {
	view: string
	id: string
	componentType: string
	state: PlainComponentState
}

export { ComponentState, PlainComponentState }
