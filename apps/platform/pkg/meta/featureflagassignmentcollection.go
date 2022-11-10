package meta

import (
	"strconv"
)

type FeatureFlagAssignmentCollection []*FeatureFlagAssignment

func (ffac *FeatureFlagAssignmentCollection) GetName() string {
	return "uesio/core.featureflagassignment"
}

func (ffac *FeatureFlagAssignmentCollection) GetFields() []string {
	return StandardGetFields(&FeatureFlagAssignment{})
}

func (ffac *FeatureFlagAssignmentCollection) GetItem(index int) Item {
	return (*ffac)[index]
}

func (ffac *FeatureFlagAssignmentCollection) NewItem() Item {
	return &FeatureFlagAssignment{}
}

func (ffsc *FeatureFlagAssignmentCollection) AddItem(item Item) {
	*ffsc = append(*ffsc, item.(*FeatureFlagAssignment))
}

func (ffac *FeatureFlagAssignmentCollection) Loop(iter GroupIterator) error {
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
