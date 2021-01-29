type FieldValue = string | number | boolean | undefined | null | PlainWireRecord

type PlainWireRecord = {
	[key: string]: FieldValue
}

export { PlainWireRecord, FieldValue }
