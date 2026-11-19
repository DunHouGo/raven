import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { availabilityOptions } from "./useSetAvailability"

beforeEach(() => {
    vi.stubGlobal("window", {
        frappe: {
            _messages: {
                Online: "在线",
                Away: "离开",
                "Do not disturb": "勿扰",
                Invisible: "隐身",
            },
        },
    })
})

afterEach(() => vi.unstubAllGlobals())

describe("availabilityOptions", () => {
    it("shows the Available value as Online while preserving Raven's stored value", () => {
        expect(availabilityOptions()).toEqual([
            { value: "Available", label: "在线" },
            { value: "Away", label: "离开" },
            { value: "Do not disturb", label: "勿扰" },
            { value: "Invisible", label: "隐身" },
        ])
    })
})
