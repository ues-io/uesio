package meta

type BulkJob struct {
	AutoID     string   `json:"uesio/core.autoid"`
	Spec       *JobSpec `json:"uesio/core.spec"`
	Collection string   `json:"uesio/core.collection"`
	BuiltIn
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
