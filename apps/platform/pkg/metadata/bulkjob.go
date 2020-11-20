package metadata

import "github.com/thecloudmasters/uesio/pkg/reqs"

// BulkJob struct
type BulkJob struct {
	ID   string  `uesio:"uesio.id"`
	Name string  `uesio:"uesio.name"`
	Spec JobSpec `uesio:"uesio.spec"`
	Site string  `uesio:"uesio.site"`
}

// JobSpec struct
type JobSpec struct {
	FileType   string                  `json:"filetype" uesio:"uesio.filetype"`
	Collection string                  `json:"collection" uesio:"uesio.collection"`
	UpsertKey  string                  `json:"upsertkey" uesio:"uesio.upsertkey"`
	Mappings   map[string]FieldMapping `json:"mappings" uesio:"uesio.mappings"`
}

// FieldMapping struct
type FieldMapping struct {
	FieldName  string `json:"fieldname"`
	MatchField string `json:"matchfield"`
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

// GetConditions function
func (bj *BulkJob) GetConditions() ([]reqs.LoadRequestCondition, error) {
	return []reqs.LoadRequestCondition{
		{
			Field: "uesio.id",
			Value: bj.ID,
		},
	}, nil
}

// GetKey function
func (bj *BulkJob) GetKey() string {
	return bj.ID
}

// GetNamespace function
func (bj *BulkJob) GetNamespace() string {
	return ""
}

// SetNamespace function
func (bj *BulkJob) SetNamespace(namespace string) {

}

// SetWorkspace function
func (bj *BulkJob) SetWorkspace(workspace string) {

}
