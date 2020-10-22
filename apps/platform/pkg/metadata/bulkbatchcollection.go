package metadata

// BulkBatchCollection slice
type BulkBatchCollection []BulkBatch

// GetName function
func (bbc *BulkBatchCollection) GetName() string {
	return "bulkbatches"
}

// GetFields function
func (bbc *BulkBatchCollection) GetFields() []string {
	return []string{"id", "status"}
}

// UnMarshal function
func (bbc *BulkBatchCollection) UnMarshal(data []map[string]interface{}) error {
	return StandardDecoder(bbc, data)
}

// Marshal function
func (bbc *BulkBatchCollection) Marshal() ([]map[string]interface{}, error) {
	return StandardEncoder(bbc)
}

// GetItem function
func (bbc *BulkBatchCollection) GetItem(index int) CollectionableItem {
	actual := *bbc
	return &actual[index]
}
