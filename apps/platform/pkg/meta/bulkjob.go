package meta

type BulkJob struct {
	ID         string    `uesio:"uesio/core.id"`
	UniqueKey  string    `yaml:"-" uesio:"uesio/core.uniquekey"`
	AutoID     string    `uesio:"uesio/core.autoid"`
	Spec       *JobSpec  `uesio:"uesio/core.spec"`
	Collection string    `uesio:"uesio/core.collection"`
	itemMeta   *ItemMeta `yaml:"-" uesio:"-"`
	CreatedBy  *User     `yaml:"-" uesio:"uesio/core.createdby"`
	Owner      *User     `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy  *User     `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt  int64     `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt  int64     `yaml:"-" uesio:"uesio/core.createdat"`
}

func (bj *BulkJob) GetCollectionName() string {
	return bj.GetCollection().GetName()
}

func (bj *BulkJob) GetCollection() CollectionableGroup {
	var bjc BulkJobCollection
	return &bjc
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
