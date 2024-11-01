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
	userCache = cache.NewPlatformCache[*meta.User]("user", 0)
	hostCache = cache.NewPlatformCache[*meta.Site]("host", 0)
}

func GetUserCacheKey(userid string, site *meta.Site) string {
	return fmt.Sprintf("%s:%s:%s", userid, site.GetAppFullName(), site.ID)
}

func getHostKey(domainType, domainValue string) string {
	return fmt.Sprintf("%s:%s", domainType, domainValue)
}

func DeleteUserCacheEntries(userKeys ...string) error {
	return userCache.Del(userKeys...)
}

func setUserCache(userUniqueKey string, site *meta.Site, user *meta.User) error {
	return userCache.Set(GetUserCacheKey(userUniqueKey, site), user)
}

func getUserCache(userUniqueKey string, site *meta.Site) (*meta.User, bool) {
	user, err := userCache.Get(GetUserCacheKey(userUniqueKey, site))
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
