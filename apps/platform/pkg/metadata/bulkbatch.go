package metadata

import "github.com/thecloudmasters/uesio/pkg/reqs"

// BulkBatch struct
type BulkBatch struct {
	ID        string `uesio:"uesio.id"`
	BulkJobID string `uesio:"uesio.bulkjobid"`
	Status    string `uesio:"uesio.status"`
}

// GetCollectionName function
func (bb *BulkBatch) GetCollectionName() string {
	return bb.GetCollection().GetName()
}

// GetCollection function
func (bb *BulkBatch) GetCollection() CollectionableGroup {
	var bbc BulkBatchCollection
	return &bbc
}

// GetConditions function
func (bb *BulkBatch) GetConditions() ([]reqs.LoadRequestCondition, error) {
	return []reqs.LoadRequestCondition{
		{
			Field: "uesio.id",
			Value: bb.ID,
		},
	}, nil
}

// GetKey function
func (bb *BulkBatch) GetKey() string {
	return bb.ID
}

// GetNamespace function
func (bb *BulkBatch) GetNamespace() string {
	return ""
}

// SetNamespace function
func (bb *BulkBatch) SetNamespace(namespace string) {

}

// SetWorkspace function
func (bb *BulkBatch) SetWorkspace(workspace string) {

}
