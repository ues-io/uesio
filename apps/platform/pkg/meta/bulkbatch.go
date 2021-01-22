package meta

// BulkBatch struct
type BulkBatch struct {
	ID        string `uesio:"uesio.id"`
	BulkJobID string `uesio:"uesio.bulkjobid"`
	Status    string `uesio:"uesio.status"`
}

// GetCollectionName function
func (bb *BulkBatch) GetCollectionName() string {
	return bb.GetCollection().GetName()
}

// GetCollection function
func (bb *BulkBatch) GetCollection() CollectionableGroup {
	var bbc BulkBatchCollection
	return &bbc
}

// SetField function
func (bb *BulkBatch) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(bb, fieldName, value)
}

// GetField function
func (bb *BulkBatch) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(bb, fieldName)
}
