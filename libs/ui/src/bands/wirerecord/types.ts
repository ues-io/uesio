import { SelectOption } from "../field/types"

type FieldValue =
	| string
	| number
	| boolean
	| undefined
	| null
	| PlainWireRecord
	| SelectOption[]

type PlainWireRecord = {
	[key: string]: FieldValue
}

export { PlainWireRecord, FieldValue }
