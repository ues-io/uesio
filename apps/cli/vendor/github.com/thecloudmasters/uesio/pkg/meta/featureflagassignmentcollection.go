package meta

import (
	"strconv"
)

type FeatureFlagAssignmentCollection []*FeatureFlagAssignment

var FEATUREFLAGASSIGNMENT_COLLECTION_NAME = "uesio/core.featureflagassignment"
var FEATUREFLAGASSIGNMENT_FIELDS = StandardGetFields(&FeatureFlagAssignment{})

func (ffac *FeatureFlagAssignmentCollection) GetName() string {
	return FEATUREFLAGASSIGNMENT_COLLECTION_NAME
}

func (ffac *FeatureFlagAssignmentCollection) GetFields() []string {
	return FEATUREFLAGASSIGNMENT_FIELDS
}

func (ffac *FeatureFlagAssignmentCollection) NewItem() Item {
	return &FeatureFlagAssignment{}
}

func (ffsc *FeatureFlagAssignmentCollection) AddItem(item Item) error {
	*ffsc = append(*ffsc, item.(*FeatureFlagAssignment))
	return nil
}

func (ffac *FeatureFlagAssignmentCollection) Loop(iter GroupIterator) error {
	for index, ffa := range *ffac {
		err := iter(ffa, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (ffac *FeatureFlagAssignmentCollection) Len() int {
	return len(*ffac)
}
