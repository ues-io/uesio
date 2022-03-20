package meta

import (
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// FeatureFlagAssignmentCollection slice
type FeatureFlagAssignmentCollection []FeatureFlagAssignment

// GetName function
func (ffac *FeatureFlagAssignmentCollection) GetName() string {
	return "uesio/core.featureflagassignments"
}

// GetFields function
func (ffac *FeatureFlagAssignmentCollection) GetFields() []string {
	return StandardGetFields(&FeatureFlagAssignment{})
}

// GetItem function
func (ffac *FeatureFlagAssignmentCollection) GetItem(index int) loadable.Item {
	return &(*ffac)[index]
}

// NewItem function
func (ffac *FeatureFlagAssignmentCollection) NewItem() loadable.Item {
	*ffac = append(*ffac, FeatureFlagAssignment{})
	return &(*ffac)[len(*ffac)-1]
}

// Loop function
func (ffac *FeatureFlagAssignmentCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *ffac {
		err := iter(ffac.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (ffac *FeatureFlagAssignmentCollection) Len() int {
	return len(*ffac)
}

// GetItems function
func (ffac *FeatureFlagAssignmentCollection) GetItems() interface{} {
	return *ffac
}
