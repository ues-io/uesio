package meta

// BulkJob struct
type BulkJob struct {
	ID        string    `uesio:"uesio.id"`
	Spec      JobSpec   `uesio:"uesio.spec"`
	itemMeta  *ItemMeta `yaml:"-" uesio:"-"`
	CreatedBy *User     `yaml:"-" uesio:"uesio.createdby"`
	Owner     *User     `yaml:"-" uesio:"uesio.owner"`
	UpdatedBy *User     `yaml:"-" uesio:"uesio.updatedby"`
	UpdatedAt int64     `yaml:"-" uesio:"uesio.updatedat"`
	CreatedAt int64     `yaml:"-" uesio:"uesio.createdat"`
}

// JobSpec struct
type JobSpec struct {
	FileType   string                  `json:"uesio.filetype" uesio:"uesio.filetype"`
	Collection string                  `json:"uesio.collection" uesio:"uesio.collection"`
	UpsertKey  string                  `json:"uesio.upsertkey" uesio:"uesio.upsertkey"`
	Mappings   map[string]FieldMapping `json:"uesio.mappings" uesio:"uesio.mappings"`
}

// FieldMapping struct
type FieldMapping struct {
	FieldName  string `json:"fieldname" uesio:"FieldName"`
	MatchField string `json:"matchfield" uesio:"MatchField"`
}

// GetCollectionName function
func (bj *BulkJob) GetCollectionName() string {
	return bj.GetCollection().GetName()
}

// GetCollection function
func (bj *BulkJob) GetCollection() CollectionableGroup {
	var bjc BulkJobCollection
	return &bjc
}

// SetField function
func (bj *BulkJob) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(bj, fieldName, value)
}

// GetField function
func (bj *BulkJob) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(bj, fieldName)
}

// Loop function
func (bj *BulkJob) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(bj, iter)
}

// Len function
func (bj *BulkJob) Len() int {
	return StandardItemLen(bj)
}

// GetItemMeta function
func (bj *BulkJob) GetItemMeta() *ItemMeta {
	return bj.itemMeta
}

// SetItemMeta function
func (bj *BulkJob) SetItemMeta(itemMeta *ItemMeta) {
	bj.itemMeta = itemMeta
}
