package meta

type JobSpec struct {
	JobType        string                  `json:"jobtype" uesio:"uesio/core.jobtype"`
	FileType       string                  `json:"filetype" uesio:"uesio/core.filetype"`
	Collection     string                  `json:"collection" uesio:"uesio/core.collection"`
	UpsertKey      string                  `json:"upsertkey" uesio:"uesio/core.upsertkey"`
	UpsertTemplate string                  `json:"upserttemplate" uesio:"uesio/core.upserttemplate"`
	UploadField    string                  `json:"uploadfield" uesio:"uesio/core.uploadfield"`
	Mappings       map[string]FieldMapping `json:"mappings" uesio:"uesio/core.mappings"`
	itemMeta       *ItemMeta               `yaml:"-" uesio:"-"`
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
