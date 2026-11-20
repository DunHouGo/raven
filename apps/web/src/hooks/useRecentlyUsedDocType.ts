import { siteKey } from "@lib/site"
import { useCallback } from "react"
import { useLocalStorage } from "usehooks-ts"

const STORAGE_KEY = "recently-used-doctype"
const MAX_RECENT = 5

/**
 * Move `item` to the front of `list`, de-duplicated and capped. Re-picking an
 * entry that is already present bumps it — v2's version skipped the write
 * entirely in that case, so its "recent" order never reflected actual recency.
 */
export const toMostRecent = (list: string[], item: string, limit: number = MAX_RECENT): string[] =>
	[item, ...list.filter((entry) => entry !== item)].slice(0, limit)

/**
 * The doctypes this user picked most recently. Persisted in localStorage (v2 used sessionStorage, which lost
 * the list on every tab close).
 */
export const useRecentlyUsedDocType = () => {
	const [recent, setRecent] = useLocalStorage<string[]>(siteKey(STORAGE_KEY), [])

	const addRecentlyUsedDocType = useCallback(
		(doctype: string) => setRecent((previous) => toMostRecent(previous, doctype)),
		[setRecent],
	)

	return { recentlyUsedDocumentTypes: recent, addRecentlyUsedDocType }
}
