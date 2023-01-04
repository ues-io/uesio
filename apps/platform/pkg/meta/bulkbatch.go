package meta

type BulkBatch struct {
	AutoID    string            `json:"uesio/core.autoid"`
	BulkJobID string            `json:"uesio/core.bulkjobid"`
	Status    string            `json:"uesio/core.status"`
	Result    *UserFileMetadata `json:"uesio/core.result"`
	BuiltIn   `yaml:",inline"`
}

func (bb *BulkBatch) GetCollectionName() string {
	return BULKBATCH_COLLECTION_NAME
}

func (bb *BulkBatch) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(bb, fieldName, value)
}

func (bb *BulkBatch) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(bb, fieldName)
}

func (bb *BulkBatch) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(bb, iter)
}

func (bb *BulkBatch) Len() int {
	return StandardItemLen(bb)
}
