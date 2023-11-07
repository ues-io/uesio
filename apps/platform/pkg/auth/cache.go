package auth

import (
	"errors"
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

var userCache cache.Cache[*meta.User]
var hostCache cache.Cache[*meta.Site]

func init() {
	userCache = cache.NewRedisCache[*meta.User]("user")
	hostCache = cache.NewRedisCache[*meta.Site]("host")
}

func GetUserCacheKey(userid, siteId string) string {
	// 11/7/23 - added "v2:"" to force a cache bust because we added "uesio/core.owner" to the fields
	// After a few days of this being live in Prod, we can remove "v2:" prefix again
	return fmt.Sprintf("v2:%s:%s", userid, siteId)
}

func getHostKey(domainType, domainValue string) string {
	return fmt.Sprintf("%s:%s", domainType, domainValue)
}

func DeleteUserCacheEntries(userKeys ...string) error {
	return userCache.Del(userKeys...)
}

func setUserCache(userUniqueKey, siteId string, user *meta.User) error {
	return userCache.Set(GetUserCacheKey(userUniqueKey, siteId), user)
}

func getUserCache(userUniqueKey, siteId string) (*meta.User, bool) {
	user, err := userCache.Get(GetUserCacheKey(userUniqueKey, siteId))
	if err != nil || user == nil {
		return nil, false
	}
	return user, true
}

func setHostCache(domainType, domainValue string, site *meta.Site) error {
	return hostCache.Set(getHostKey(domainType, domainValue), site)
}

func getHostCache(domainType, domainValue string) (*meta.Site, bool) {
	site, err := hostCache.Get(getHostKey(domainType, domainValue))
	if err != nil || site == nil {
		return nil, false
	}
	return site, true
}

func ClearHostCacheForDomains(ids []string) error {
	keys := make([]string, len(ids))
	for i, id := range ids {
		key, err := getHostKeyFromDomainId(id)
		if err != nil {
			return err
		}
		keys[i] = key
	}
	return hostCache.Del(keys...)
}

func getHostKeyFromDomainId(id string) (string, error) {
	idParts := strings.Split(id, ":")
	if len(idParts) != 2 {
		return "", errors.New("Bad Domain ID: " + id)
	}
	return getHostKey(idParts[1], idParts[0]), nil
}
