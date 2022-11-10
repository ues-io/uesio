package meta

type BulkJob struct {
	ID         string    `json:"uesio/core.id"`
	UniqueKey  string    `json:"uesio/core.uniquekey"`
	AutoID     string    `json:"uesio/core.autoid"`
	Spec       *JobSpec  `json:"uesio/core.spec"`
	Collection string    `json:"uesio/core.collection"`
	itemMeta   *ItemMeta `json:"-"`
	CreatedBy  *User     `json:"uesio/core.createdby"`
	Owner      *User     `json:"uesio/core.owner"`
	UpdatedBy  *User     `json:"uesio/core.updatedby"`
	UpdatedAt  int64     `json:"uesio/core.updatedat"`
	CreatedAt  int64     `json:"uesio/core.createdat"`
}

func (bj *BulkJob) GetCollectionName() string {
	return bj.GetCollection().GetName()
}

func (bj *BulkJob) GetCollection() CollectionableGroup {
	return &BulkJobCollection{}
}

func (bj *BulkJob) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(bj, fieldName, value)
}

func (bj *BulkJob) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(bj, fieldName)
}

func (bj *BulkJob) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(bj, iter)
}

func (bj *BulkJob) Len() int {
	return StandardItemLen(bj)
}

func (bj *BulkJob) GetItemMeta() *ItemMeta {
	return bj.itemMeta
}

func (bj *BulkJob) SetItemMeta(itemMeta *ItemMeta) {
	bj.itemMeta = itemMeta
}
