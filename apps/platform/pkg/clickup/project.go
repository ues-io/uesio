package clickup

import (
	"fmt"

	"github.com/teris-io/shortid"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type ProjectResponse struct {
	Projects []Project `json:"folders"`
}

type Project struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Lists []List `json:"lists"`
}

type List struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

func ProjectLoadBot(op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {

	metadata := connection.GetMetadata()

	collectionMetadata, err := metadata.GetCollection("tcm/timetracker.project")
	if err != nil {
		return err
	}

	spaceID := "8863869"

	url := fmt.Sprintf("space/%s/folder?archived=false", spaceID)

	data := ProjectResponse{}

	err = makeRequest(&data, url)
	if err != nil {
		return err
	}

	collectionMetadata.SetField(&adapt.FieldMetadata{
		Name:       "name",
		Namespace:  "tcm/timetracker",
		Createable: false,
		Accessible: true,
		Updateable: false,
		Type:       "TEXT",
		Label:      "Name",
	})

	collectionMetadata.SetField(&adapt.FieldMetadata{
		Name:       "lists",
		Namespace:  "tcm/timetracker",
		Createable: false,
		Accessible: true,
		Updateable: false,
		Type:       "LIST",
		Label:      "Lists",
		SubType:    "MAP",
		SubFields: map[string]*adapt.FieldMetadata{
			"id": {
				Label: "ID",
				Type:  "TEXT",
			},
			"name": {
				Label: "Name",
				Type:  "TEXT",
			},
		},
	})

	for _, project := range data.Projects {
		opItem := op.Collection.NewItem()
		fakeID, _ := shortid.Generate()

		opItem.SetField("uesio/core.id", fakeID)
		opItem.SetField("tcm/timetracker.name", project.Name)
		opItem.SetField("tcm/timetracker.lists", project.Lists)
	}

	return nil

}
