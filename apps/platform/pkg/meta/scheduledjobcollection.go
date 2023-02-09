package meta

import (
	"strconv"
)

type ScheduledJobCollection []*ScheduledJob

var SCHEDULEDJOB_COLLECTION_NAME = "uesio/studio.scheduledjob"
var SCHEDULEDJOB_FOLDER_NAME = "scheduledjobs"
var SCHEDULEDJOB_FIELDS = StandardGetFields(&ScheduledJob{})

func (sc *ScheduledJobCollection) GetName() string {
	return SCHEDULEDJOB_COLLECTION_NAME
}

func (sc *ScheduledJobCollection) GetBundleFolderName() string {
	return SCHEDULEDJOB_FOLDER_NAME
}

func (sc *ScheduledJobCollection) GetFields() []string {
	return SCHEDULEDJOB_FIELDS
}

func (sc *ScheduledJobCollection) NewItem() Item {
	return &ScheduledJob{}
}

func (sc *ScheduledJobCollection) AddItem(item Item) {
	*sc = append(*sc, item.(*ScheduledJob))
}

func (sc *ScheduledJobCollection) GetItemFromPath(path, namespace string) BundleableItem {
	return NewBaseScheduledJob(namespace, StandardNameFromPath(path))
}

func (sc *ScheduledJobCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return StandardPathFilter(path)
}

func (sc *ScheduledJobCollection) Loop(iter GroupIterator) error {
	for index, s := range *sc {
		err := iter(s, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (sc *ScheduledJobCollection) Len() int {
	return len(*sc)
}
