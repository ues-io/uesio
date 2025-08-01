package auth

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
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
	return fmt.Sprintf("%s:%s", userid, site.GetFullName())
}

func getHostKey(domainType, domainValue string) string {
	return fmt.Sprintf("%s:%s", domainType, domainValue)
}

func DeleteUserCacheEntries(userKeys ...string) error {
	return userCache.Del(userKeys...)
}

func InvalidateUserCache() error {
	return userCache.DeleteAll()
}

func setUserCache(userUniqueKey string, site *meta.Site, user *meta.User) error {
	// Shallow clone the user, so the caller doesn't have
	// a reference to the one in the cache.
	clonedUser := *user
	return userCache.Set(GetUserCacheKey(userUniqueKey, site), &clonedUser)
}

func getUserCache(ctx context.Context, userUniqueKey string, site *meta.Site) (*meta.User, bool) {
	user, err := userCache.Get(GetUserCacheKey(userUniqueKey, site))
	if err != nil {
		if errors.Is(err, cache.ErrKeyNotFound) {
			return nil, false
		} else {
			slog.ErrorContext(ctx, fmt.Sprintf("error getting user for key [%s] from cache: %v", userUniqueKey, err))
			return nil, false
		}
	}
	// Shallow clone the user, so the caller doesn't have
	// a reference to the one in the cache.
	clonedUser := *user
	return &clonedUser, true
}

func setHostCache(domainType, domainValue string, site *meta.Site) error {
	return hostCache.Set(getHostKey(domainType, domainValue), site)
}

func getHostCache(ctx context.Context, domainType, domainValue string) (*meta.Site, bool) {
	site, err := hostCache.Get(getHostKey(domainType, domainValue))
	if err != nil {
		if errors.Is(err, cache.ErrKeyNotFound) {
			return nil, false
		} else {
			slog.ErrorContext(ctx, fmt.Sprintf("error getting site for domain type [%s] and value [%s] from cache: %v", domainType, domainValue, err))
			return nil, false
		}
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

func InvalidateHostCache() error {
	return hostCache.DeleteAll()
}

func getHostKeyFromDomainId(id string) (string, error) {
	idParts := strings.Split(id, ":")
	if len(idParts) != 2 {
		return "", fmt.Errorf("bad domain id: %s", id)
	}
	return getHostKey(idParts[1], idParts[0]), nil
}

func InvalidateCache() error {
	if err := InvalidateUserCache(); err != nil {
		return err
	}

	if err := InvalidateHostCache(); err != nil {
		return err
	}

	return nil
}
