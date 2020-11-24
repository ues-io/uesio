package metadata

// BulkJobCollection slice
type BulkJobCollection []BulkJob

// GetName function
func (bjc *BulkJobCollection) GetName() string {
	return "bulkjobs"
}

// GetFields function
func (bjc *BulkJobCollection) GetFields() []string {
	return []string{"id", "site", "spec"}
}

// UnMarshal function
func (bjc *BulkJobCollection) UnMarshal(data []map[string]interface{}) error {
	return StandardDecoder(bjc, data)
}

// Marshal function
func (bjc *BulkJobCollection) Marshal() ([]map[string]interface{}, error) {
	return StandardEncoder(bjc)
}

// GetItem function
func (bjc *BulkJobCollection) GetItem(index int) CollectionableItem {
	actual := *bjc
	return &actual[index]
}

// Loop function
func (bjc *BulkJobCollection) Loop(iter func(item CollectionableItem) error) error {
	for index := range *bjc {
		err := iter(bjc.GetItem(index))
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (bjc *BulkJobCollection) Len() int {
	return len(*bjc)
}
