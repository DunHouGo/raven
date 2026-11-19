import { describe, expect, it } from "vitest"
import { getSuggestedDocumentTypes, toMostRecent } from "./useRecentlyUsedDocType"

describe("toMostRecent", () => {
    it("prepends a new entry", () => {
        expect(toMostRecent(["Task"], "Issue")).toEqual(["Issue", "Task"])
    })

    it("bumps an existing entry to the front instead of ignoring it", () => {
        expect(toMostRecent(["Task", "Issue", "Lead"], "Lead")).toEqual(["Lead", "Task", "Issue"])
    })

    it("never duplicates", () => {
        expect(toMostRecent(["Task", "Issue"], "Task")).toEqual(["Task", "Issue"])
    })

    it("caps the list at the limit, dropping the oldest", () => {
        expect(toMostRecent(["A", "B", "C", "D", "E"], "F", 5)).toEqual(["F", "A", "B", "C", "D"])
    })

    it("handles an empty list", () => {
        expect(toMostRecent([], "Task")).toEqual(["Task"])
    })
})

describe("getSuggestedDocumentTypes", () => {
    it("starts with common business documents", () => {
        expect(getSuggestedDocumentTypes([]).slice(0, 6).map((item) => item.value)).toEqual([
            "Sales Order",
            "Item",
            "Customer",
            "Email Queue",
            "Task",
            "Knowledge Base",
        ])
        expect(getSuggestedDocumentTypes([])[1].description).toBe("Products")
		expect(getSuggestedDocumentTypes([])[1].label).toBe("Product")
    })

    it("keeps recent non-common documents after the common list", () => {
        const suggestions = getSuggestedDocumentTypes(["Automation Flow", "Customer"])

        expect(suggestions[suggestions.length - 1]).toEqual({ value: "Automation Flow", description: "Recently used" })
        expect(suggestions.filter((item) => item.value === "Customer")).toHaveLength(1)
    })
})
