package meta

type BulkBatch struct {
	ID        string            `uesio:"uesio/core.id"`
	UniqueKey string            `yaml:"-" uesio:"uesio/core.uniquekey"`
	AutoID    string            `uesio:"uesio/core.autoid"`
	BulkJobID string            `uesio:"uesio/core.bulkjobid"`
	Status    string            `uesio:"uesio/core.status"`
	Result    *UserFileMetadata `yaml:"-" uesio:"uesio/core.result"`
	itemMeta  *ItemMeta         `yaml:"-" uesio:"-"`
	CreatedBy *User             `yaml:"-" uesio:"uesio/core.createdby"`
	Owner     *User             `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy *User             `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt int64             `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt int64             `yaml:"-" uesio:"uesio/core.createdat"`
}

func (bb *BulkBatch) GetCollectionName() string {
	return bb.GetCollection().GetName()
}

func (bb *BulkBatch) GetCollection() CollectionableGroup {
	var bbc BulkBatchCollection
	return &bbc
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

func (bb *BulkBatch) GetItemMeta() *ItemMeta {
	return bb.itemMeta
}

func (bb *BulkBatch) SetItemMeta(itemMeta *ItemMeta) {
	bb.itemMeta = itemMeta
}
