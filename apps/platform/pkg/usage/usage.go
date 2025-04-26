package usage

import (
	"fmt"
	"os"
	"time"

	"github.com/thecloudmasters/uesio/pkg/sess"
)

type UsageHandler interface {
	Set(key string, size int64) error
	ApplyBatch(session *sess.Session) error
}

var usageHandlerMap = map[string]UsageHandler{}
var activeHandler string

func init() {
	usageHandler := os.Getenv("UESIO_USAGE_HANDLER")
	switch usageHandler {
	case "redis":
		activeHandler = "redis"
	case "", "memory":
		activeHandler = "memory"
	default:
		// TODO: The panic here is not ideal but do the way we use init throughout the
		// codebase we can't handle errors and would only panic anyway.  Need to
		// refactor how we initialize so that we can improve error handling and avoid
		// panics.
		panic("UESIO_USAGE_HANDLER is an unrecognized value: " + usageHandler)
	}
}

func RegisterUsageHandler(name string, handler UsageHandler) {
	usageHandlerMap[name] = handler
}

func getActiveHandler() UsageHandler {
	return usageHandlerMap[activeHandler]
}

func RegisterEvent(actiontype, metadatatype, metadataname string, size int64, session *sess.Session) error {

	user := session.GetSiteUser()

	if user.Username == "boot" || user.Username == "system" {
		return nil
	}

	if user.ID == "" {
		return fmt.Errorf("error registering usage event: empty user id")
	}

	currentTime := time.Now()
	key := fmt.Sprintf("event:%s:%s:%s:%s:%s:%s", session.GetSiteTenantID(), user.ID, currentTime.Format("2006-01-02"), actiontype, metadatatype, metadataname)

	return getActiveHandler().Set(key, size)

}

func ApplyBatch(session *sess.Session) error {
	return getActiveHandler().ApplyBatch(session)
}
