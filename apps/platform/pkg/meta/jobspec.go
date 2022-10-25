package meta

type JobSpec struct {
	JobType     string                  `json:"uesio/core.jobtype"`
	FileType    string                  `json:"uesio/core.filetype"`
	Collection  string                  `json:"uesio/core.collection"`
	UploadField string                  `json:"uesio/core.uploadfield"`
	Mappings    map[string]FieldMapping `json:"uesio/core.mappings"`
	itemMeta    *ItemMeta               `json:"-"`
}

func (a *JobSpec) GetCollectionName() string {
	return a.GetCollection().GetName()
}

func (a *JobSpec) GetCollection() CollectionableGroup {
	return nil
}

func (a *JobSpec) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(a, fieldName, value)
}

func (a *JobSpec) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(a, fieldName)
}

func (a *JobSpec) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(a, iter)
}

func (a *JobSpec) Len() int {
	return StandardItemLen(a)
}

func (a *JobSpec) GetItemMeta() *ItemMeta {
	return a.itemMeta
}

func (a *JobSpec) SetItemMeta(itemMeta *ItemMeta) {
	a.itemMeta = itemMeta
}

type JobSpecRequest struct {
	JobType     string                  `json:"jobtype"`
	FileType    string                  `json:"filetype"`
	Collection  string                  `json:"collection"`
	UploadField string                  `json:"uploadfield"`
	Mappings    map[string]FieldMapping `json:"mappings"`
	itemMeta    *ItemMeta               `json:"-"`
}
