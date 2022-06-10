package meta

import (
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

type AppCollection []*App

func (ac *AppCollection) GetName() string {
	return "uesio/studio.app"
}

func (ac *AppCollection) GetFields() []string {
	return StandardGetFields(&App{})
}

func (ac *AppCollection) GetItem(index int) loadable.Item {
	return (*ac)[index]
}

func (ac *AppCollection) NewItem() loadable.Item {
	app := &App{}
	*ac = append(*ac, app)
	return app
}

func (ac *AppCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *ac {
		err := iter(ac.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (ac *AppCollection) Len() int {
	return len(*ac)
}

func (ac *AppCollection) GetItems() interface{} {
	return *ac
}
