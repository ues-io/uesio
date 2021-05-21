type FieldValue = PlainFieldValue | PlainWireRecord | PlainFieldValue[]

type PlainWireRecord = {
	[key: string]: FieldValue
}

type PlainFieldValue = string | number | boolean | undefined | null

export { PlainWireRecord, FieldValue }
