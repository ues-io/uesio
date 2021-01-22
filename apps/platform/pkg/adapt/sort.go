package adapt

import "errors"

// ApplyLimitAndOffset function
func ApplyLimitAndOffset(op *LoadOp) error {

	start := op.Offset
	end := op.Offset + op.Limit
	collectionLen := op.Collection.Len()

	//we just have offset then the limit is collectionLen
	if op.Limit == 0 {
		end = collectionLen
	}

	//no negative numbers
	if start < 0 || end < 0 {
		return errors.New("Slice error: no negative numbers")
	}

	//the end is biger than the Collection or 0, then end is the last element.
	if end > collectionLen || end == 0 {
		end = collectionLen
	}

	//out of the range
	if start >= collectionLen {
		return errors.New("Slice error: out of range")
	}

	op.Collection.Slice(start, end)

	return nil

}

// LessFunc function
func LessFunc(data interface{}, order []LoadRequestOrder) (func(i int, j int) bool, bool) {

	dataCast, ok := data.([]Item)

	if !ok {
		return nil, ok
	}

	sortFunc := func(i, j int) bool {

		for _, singleOrder := range order {

			vi, _ := dataCast[i].GetField(singleOrder.Field)
			vj, _ := dataCast[j].GetField(singleOrder.Field)

			switch vi.(type) {
			case string:
				if vi.(string) == vj.(string) {
					continue
				}
				if singleOrder.Desc {
					return vi.(string) > vj.(string)
				}
				return vi.(string) < vj.(string)
			case int:
				if vi.(int) == vj.(int) {
					continue
				}
				if singleOrder.Desc {
					return vi.(int) > vj.(int)
				}
				return vi.(int) < vj.(int)
			case float64:
				if vi.(float64) == vj.(float64) {
					continue
				}
				if singleOrder.Desc {
					return vi.(float64) > vj.(float64)
				}
				return vi.(float64) < vj.(float64)
			}

		}
		return true
	}

	return sortFunc, true

}
