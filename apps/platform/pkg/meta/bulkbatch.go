package meta

// BulkBatch struct
type BulkBatch struct {
	ID        string            `uesio:"uesio/uesio.id"`
	AutoID    string            `uesio:"uesio/uesio.autoid"`
	BulkJobID string            `uesio:"uesio/uesio.bulkjobid"`
	Status    string            `uesio:"uesio/uesio.status"`
	Result    *UserFileMetadata `yaml:"-" uesio:"uesio/uesio.result"`
	itemMeta  *ItemMeta         `yaml:"-" uesio:"-"`
	CreatedBy *User             `yaml:"-" uesio:"uesio/uesio.createdby"`
	Owner     *User             `yaml:"-" uesio:"uesio/uesio.owner"`
	UpdatedBy *User             `yaml:"-" uesio:"uesio/uesio.updatedby"`
	UpdatedAt int64             `yaml:"-" uesio:"uesio/uesio.updatedat"`
	CreatedAt int64             `yaml:"-" uesio:"uesio/uesio.createdat"`
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

// Loop function
func (bb *BulkBatch) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(bb, iter)
}

// Len function
func (bb *BulkBatch) Len() int {
	return StandardItemLen(bb)
}

// GetItemMeta function
func (bb *BulkBatch) GetItemMeta() *ItemMeta {
	return bb.itemMeta
}

// SetItemMeta function
func (bb *BulkBatch) SetItemMeta(itemMeta *ItemMeta) {
	bb.itemMeta = itemMeta
}
