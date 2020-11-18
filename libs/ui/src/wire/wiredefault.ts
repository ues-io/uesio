const LOOKUP = "LOOKUP"
const VALUE = "VALUE"

type WireDefaultBase = {
	field: string
	valueSource?: typeof VALUE | typeof LOOKUP
}

type LookupDefault = WireDefaultBase & {
	valueSource: typeof LOOKUP
	lookupWire: string
	lookupField?: string
	lookupTemplate?: string
}

type ValueDefault = WireDefaultBase & {
	valueSource: typeof VALUE
	value: string
}

type WireDefault = ValueDefault | LookupDefault

export { LookupDefault, ValueDefault, WireDefault }
