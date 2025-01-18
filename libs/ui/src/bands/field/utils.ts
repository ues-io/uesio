import { SelectOption } from "../../definition/selectlist"

const addBlankSelectOption = (
  options: SelectOption[] | undefined,
  blankOptionLabel?: string,
): SelectOption[] => {
  let useOptions = options || []
  // Only add a blank option if we don't have one yet
  if (options?.length && !options.some((o) => o.value === "")) {
    useOptions = [
      {
        value: "",
        label: blankOptionLabel || "",
      },
    ].concat(useOptions)
  }
  return useOptions
}

export { addBlankSelectOption }
