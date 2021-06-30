package meta

// BulkBatch struct
type BulkBatch struct {
	ID        string    `uesio:"uesio.id"`
	BulkJobID string    `uesio:"uesio.bulkjobid"`
	Status    string    `uesio:"uesio.status"`
	itemMeta  *ItemMeta `yaml:"-" uesio:"-"`
	CreatedBy *User     `uesio:"uesio.createdby"`
	UpdatedBy *User     `uesio:"uesio.updatedby"`
	UpdatedAt float64   `uesio:"uesio.updatedat"`
	CreatedAt float64   `uesio:"uesio.createdat"`
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

// GetItemMeta function
func (bb *BulkBatch) GetItemMeta() *ItemMeta {
	return bb.itemMeta
}

// SetItemMeta function
func (bb *BulkBatch) SetItemMeta(itemMeta *ItemMeta) {
	bb.itemMeta = itemMeta
}
