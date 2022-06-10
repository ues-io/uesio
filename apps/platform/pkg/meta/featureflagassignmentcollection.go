package meta

import (
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

type FeatureFlagAssignmentCollection []*FeatureFlagAssignment

func (ffac *FeatureFlagAssignmentCollection) GetName() string {
	return "uesio/core.featureflagassignment"
}

func (ffac *FeatureFlagAssignmentCollection) GetFields() []string {
	return StandardGetFields(&FeatureFlagAssignment{})
}

func (ffac *FeatureFlagAssignmentCollection) GetItem(index int) loadable.Item {
	return (*ffac)[index]
}

func (ffac *FeatureFlagAssignmentCollection) NewItem() loadable.Item {
	ffa := &FeatureFlagAssignment{}
	*ffac = append(*ffac, ffa)
	return ffa
}

func (ffac *FeatureFlagAssignmentCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *ffac {
		err := iter(ffac.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (ffac *FeatureFlagAssignmentCollection) Len() int {
	return len(*ffac)
}

func (ffac *FeatureFlagAssignmentCollection) GetItems() interface{} {
	return *ffac
}
