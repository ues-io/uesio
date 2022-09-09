package print

import (
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/routing"
)

func PrintUser(user *routing.UserMergeData) {
	fmt.Println(user.FirstName + " " + user.LastName + " " + user.Profile)
}
