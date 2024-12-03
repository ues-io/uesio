package usage_memory

import (
	"time"

	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/usage/usage_common"
)

const MAX_USAGE_PER_RUN = 1000
const KEYS_SET_NAME = "USAGE_KEYS"

var usageCache *cache.MemoryCache[int64]

func init() {
	usageCache = cache.NewMemoryCache[int64](-1, 5*time.Minute)
}

type MemoryUsageHandler struct{}

func (pcuh *MemoryUsageHandler) ApplyBatch(session *sess.Session) error {

	items := usageCache.GetAll()

	changes := meta.UsageCollection{}

	for key, value := range items {
		usageItem := usage_common.GetUsageItem(key, value)
		if usageItem == nil {
			continue
		}
		changes = append(changes, usageItem)
	}

	err := usage_common.SaveBatch(changes, session)
	if err != nil {
		return err
	}

	// Remove Keys
	usageCache.DeleteAll()

	return nil

}

func (pcuh *MemoryUsageHandler) Set(key string, size int64) error {
	value, err := usageCache.Get(key)
	if err != nil {
		value = 0
	}

	if size == 0 {
		value = value + 1
	} else {
		value = value + size
	}

	return usageCache.Set(key, value)

}
