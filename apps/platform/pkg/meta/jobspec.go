package meta

type LoadRequestCondition struct {
	Field         string                 `json:"field" bot:"field" yaml:"field"`
	Value         interface{}            `json:"value" bot:"value" yaml:"value"`
	Param         string                 `json:"param" yaml:"param"`
	ValueSource   string                 `json:"valueSource" yaml:"valueSource"`
	Type          string                 `json:"type" bot:"type" yaml:"type"`
	Operator      string                 `json:"operator" bot:"operator" yaml:"operator"`
	LookupWire    string                 `json:"lookupWire" yaml:"lookupWire"`
	LookupField   string                 `json:"lookupField" yaml:"lookupField"`
	SearchFields  []string               `json:"fields" bot:"fields" yaml:"fields"`
	SubConditions []LoadRequestCondition `json:"conditions" bot:"conditions" yaml:"conditions"`
	SubCollection string                 `json:"subcollection" bot:"subcollection" yaml:"subcollection"`
	SubField      string                 `json:"subfield" bot:"subfield" yaml:"subfield"`
	Conjunction   string                 `json:"conjunction" bot:"conjunction" yaml:"conjunction"`
}

type JobSpec struct {
	JobType     string                  `json:"uesio/core.jobtype"`
	FileType    string                  `json:"uesio/core.filetype"`
	Collection  string                  `json:"uesio/core.collection"`
	UploadField string                  `json:"uesio/core.uploadfield"`
	Mappings    map[string]FieldMapping `json:"uesio/core.mappings"`
	itemMeta    *ItemMeta               `json:"-"`
	Conditions  []LoadRequestCondition  `json:"-"`
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
	Conditions  []LoadRequestCondition  `json:"conditions"`
}
