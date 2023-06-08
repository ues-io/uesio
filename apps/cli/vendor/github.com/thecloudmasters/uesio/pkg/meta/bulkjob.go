package meta

type BulkJob struct {
	BuiltIn    `yaml:",inline"`
	AutoID     string   `json:"uesio/core.autoid"`
	Spec       *JobSpec `json:"uesio/core.spec"`
	Collection string   `json:"uesio/core.collection"`
}

func (bj *BulkJob) GetCollectionName() string {
	return BULKJOB_COLLECTION_NAME
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
