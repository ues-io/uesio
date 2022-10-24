package meta

type BulkBatch struct {
	ID        string            `json:"uesio/core.id"`
	UniqueKey string            `json:"uesio/core.uniquekey"`
	AutoID    string            `json:"uesio/core.autoid"`
	BulkJobID string            `json:"uesio/core.bulkjobid"`
	Status    string            `json:"uesio/core.status"`
	Result    *UserFileMetadata `json:"uesio/core.result"`
	itemMeta  *ItemMeta         `json:"-"`
	CreatedBy *User             `json:"uesio/core.createdby"`
	Owner     *User             `json:"uesio/core.owner"`
	UpdatedBy *User             `json:"uesio/core.updatedby"`
	UpdatedAt int64             `json:"uesio/core.updatedat"`
	CreatedAt int64             `json:"uesio/core.createdat"`
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
