package adapt

import (
	"crypto/md5"
	"sort"
	"strings"
)

type Credentials map[string]string

func (c *Credentials) GetHash() string {
	keys := make([]string, len(*c))
	i := 0
	for k, v := range *c {
		keys[i] = k + ":" + v
		i++
	}
	sort.Strings(keys)
	data := []byte(strings.Join(keys, ":"))
	sum := md5.Sum(data)
	return string(sum[:])
}

func (c *Credentials) GetInterfaceMap() map[string]interface{} {
	result := make(map[string]interface{}, len(*c))
	i := 0
	for k, v := range *c {
		result[k] = v
		i++
	}
	return result
}
