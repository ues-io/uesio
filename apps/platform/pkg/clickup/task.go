package clickup

import (
	"errors"
	"fmt"

	"github.com/teris-io/shortid"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type TaskResponse struct {
	Tasks []Task `json:"tasks"`
}

type Task struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

func TaskLoadBot(op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {

	metadata := connection.GetMetadata()

	collectionMetadata, err := metadata.GetCollection("tcm/timetracker.task")
	if err != nil {
		return err
	}

	// Verify that a type condition was provided
	if op.Conditions == nil || len(op.Conditions) <= 0 {
		return errors.New("Must Provide at least one condition")
	}

	listIDCondition := op.Conditions[0]

	if listIDCondition.Field != "tcm/timetracker.list" {
		return errors.New("The first condition must be on the type field")
	}

	listID := listIDCondition.Value

	collectionMetadata.SetField(&adapt.FieldMetadata{
		Name:       "name",
		Namespace:  "tcm/timetracker",
		Createable: false,
		Accessible: true,
		Updateable: false,
		Type:       "TEXT",
		Label:      "Name",
	})

	if listID == "" || listID == nil {
		return nil
	}

	url := fmt.Sprintf("list/%v/task?archived=false&page=0&subtasks=false&include_closed=true", listID)

	data := TaskResponse{}

	err = makeRequest(&data, url)
	if err != nil {
		return err
	}

	for _, task := range data.Tasks {

		opItem := op.Collection.NewItem()
		fakeID, _ := shortid.Generate()

		opItem.SetField("uesio/core.id", fakeID)
		opItem.SetField("tcm/timetracker.id", task.ID)
		opItem.SetField("tcm/timetracker.name", task.Name)
	}

	return nil

}
