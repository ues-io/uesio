package meta

type BulkJob struct {
	ID         string    `uesio:"uesio/core.id"`
	AutoID     string    `uesio:"uesio/core.autoid"`
	Spec       JobSpec   `uesio:"uesio/core.spec"`
	Collection string    `uesio:"uesio/core.collection"`
	itemMeta   *ItemMeta `yaml:"-" uesio:"-"`
	CreatedBy  *User     `yaml:"-" uesio:"uesio/core.createdby"`
	Owner      *User     `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy  *User     `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt  int64     `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt  int64     `yaml:"-" uesio:"uesio/core.createdat"`
}

type JobSpec struct {
	JobType    string                  `json:"jobtype" uesio:"uesio/core.jobtype"`
	FileType   string                  `json:"filetype" uesio:"uesio/core.filetype"`
	Collection string                  `json:"collection" uesio:"uesio/core.collection"`
	UpsertKey  string                  `json:"upsertkey" uesio:"uesio/core.upsertkey"`
	Mappings   map[string]FieldMapping `json:"mappings" uesio:"uesio/core.mappings"`
}

type FieldMapping struct {
	Type       string `json:"type" uesio:"Type"`
	ColumnName string `json:"columnname" uesio:"ColumnName"`
	MatchField string `json:"matchfield" uesio:"MatchField"`
	Value      string `json:"value" uesio:"Value"`
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
