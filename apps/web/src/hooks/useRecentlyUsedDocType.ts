import { siteKey } from "@lib/site"
import { useCallback, useMemo } from "react"
import { useLocalStorage } from "usehooks-ts"
import _ from "@lib/translate"
import type { ResultItem } from "@components/common/LinkFieldComboBox/LinkFieldCombobox"

const STORAGE_KEY = "recently-used-doctype"
const MAX_RECENT = 5

/** Common business documents shown before the server's alphabetical results. */
export const COMMON_DOCUMENT_TYPES: ResultItem[] = [
	{ value: "Sales Order", label: "Sales Order", description: "Selling" },
	{ value: "Item", label: "Item", description: "Stock" },
	{ value: "Customer", label: "Customer", description: "Selling" },
	{ value: "Email Queue", label: "Email Queue", description: "Core" },
	{ value: "Task", label: "Task", description: "Projects" },
	{ value: "Knowledge Base", label: "Knowledge Base", description: "Support" },
	{ value: "Purchase Order", label: "Purchase Order", description: "Buying" },
	{ value: "Quotation", label: "Quotation", description: "Selling" },
]

/**
 * Move `item` to the front of `list`, de-duplicated and capped. Re-picking an
 * entry that is already present bumps it — v2's version skipped the write
 * entirely in that case, so its "recent" order never reflected actual recency.
 */
export const toMostRecent = (list: string[], item: string, limit: number = MAX_RECENT): string[] =>
	[item, ...list.filter((entry) => entry !== item)].slice(0, limit)

/** Put common business documents first, followed by non-duplicate recent choices. */
export const getSuggestedDocumentTypes = (recent: string[]): ResultItem[] => {
	const commonValues = new Set(COMMON_DOCUMENT_TYPES.map((item) => item.value))
	const recentItems = recent
		.filter((doctype) => !commonValues.has(doctype))
		.map((value) => ({ value, description: "Recently used" }))

	return [...COMMON_DOCUMENT_TYPES, ...recentItems]
}

/**
 * The doctypes this user picked most recently, shaped for `LinkFieldCombobox`'s
 * `suggestedItems`. Persisted in localStorage (v2 used sessionStorage, which lost
 * the list on every tab close).
 */
export const useRecentlyUsedDocType = () => {
	const [recent, setRecent] = useLocalStorage<string[]>(siteKey(STORAGE_KEY), [])

	const addRecentlyUsedDocType = useCallback(
		(doctype: string) => setRecent((previous) => toMostRecent(previous, doctype)),
		[setRecent],
	)

	const suggestedItems = useMemo<ResultItem[]>(
		() => getSuggestedDocumentTypes(recent).map((item) => ({
			...item,
			label: _(item.label || item.value),
			description: item.description ? _(item.description) : "",
		})),
		[recent],
	)

	return { suggestedItems, addRecentlyUsedDocType }
}
