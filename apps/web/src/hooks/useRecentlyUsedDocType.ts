import { siteKey } from "@lib/site"
import { useCallback } from "react"
import { useLocalStorage } from "usehooks-ts"

const STORAGE_KEY = "recently-used-doctype"
const MAX_RECENT = 5

/** Move `item` to the front, de-duplicated and capped to the requested length. */
export const toMostRecent = (list: string[], item: string, limit: number = MAX_RECENT): string[] =>
	[item, ...list.filter((entry) => entry !== item)].slice(0, limit)

/** Persist the user's recent document choices per site. */
export const useRecentlyUsedDocType = () => {
	const [recent, setRecent] = useLocalStorage<string[]>(siteKey(STORAGE_KEY), [])
	const addRecentlyUsedDocType = useCallback(
		(doctype: string) => setRecent((previous) => toMostRecent(previous, doctype)),
		[setRecent],
	)
	return { recentlyUsedDocumentTypes: recent, addRecentlyUsedDocType }
}
