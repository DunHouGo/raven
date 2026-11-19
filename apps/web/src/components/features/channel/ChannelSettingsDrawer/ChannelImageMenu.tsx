import { useRef, useState } from "react"
import { useFrappeFileUpload, useFrappePostCall, type FrappeError } from "frappe-react-sdk"
import { ImagePlus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@components/ui/dropdown-menu"
import { Spinner } from "@components/ui/spinner"
import { errorResponseToast } from "@components/ui/error-banner"
import { ChannelAvatar } from "@components/common/ChannelAvatar/ChannelAvatar"
import { channelStore } from "@stores/channels/store"
import type { ChannelListItem } from "@raven/types/common/ChannelListItem"
import { cn } from "@lib/utils"
import _ from "@lib/translate"

type ChannelImageMenuProps = {
    channel: ChannelListItem
    canEdit: boolean
}

/** Lets channel administrators upload or remove the shared channel image. */
export function ChannelImageMenu({ channel, canEdit }: ChannelImageMenuProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [saving, setSaving] = useState(false)
    const { upload } = useFrappeFileUpload()
    const { call } = useFrappePostCall("frappe.client.set_value")

    const setImage = async (image: string) => {
        await call({
            doctype: "Raven Channel",
            name: channel.name,
            fieldname: "channel_image",
            value: image,
        })
        channelStore.patchChannel(channel.name, { channel_image: image })
    }

    const onPickImage = async (file: File | undefined) => {
        if (!file) return
        setSaving(true)
        try {
            const result = await upload(file, {
                isPrivate: false,
                doctype: "Raven Channel",
                docname: channel.name,
                otherData: { optimize: "1", is_private: "0" },
            })
            await setImage(result.file_url)
            toast.success(_("Channel photo updated"))
        } catch (error) {
            errorResponseToast(_("Could not update channel photo"), error as FrappeError)
        } finally {
            setSaving(false)
        }
    }

    const onRemoveImage = async () => {
        setSaving(true)
        try {
            await setImage("")
            toast.success(_("Channel photo removed"))
        } catch (error) {
            errorResponseToast(_("Could not remove channel photo"), error as FrappeError)
        } finally {
            setSaving(false)
        }
    }

    const avatar = (
        <span className="relative block size-10 shrink-0">
            <ChannelAvatar
                type={channel.type}
                image={channel.channel_image}
                className={cn("size-10", saving && "opacity-50")}
            />
            {saving && (
                <span className="absolute inset-0 flex items-center justify-center">
                    <Spinner className="text-ink-gray-9" />
                </span>
            )}
        </span>
    )

    if (!canEdit) return avatar

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button type="button" aria-label={_("Change channel photo")} className="rounded-md outline-none focus-visible:ring-2 ring-outline-gray-2">
                        {avatar}
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                        <ImagePlus />
                        {channel.channel_image ? _("Change channel photo") : _("Upload channel photo")}
                    </DropdownMenuItem>
                    {channel.channel_image && (
                        <DropdownMenuItem variant="destructive" onClick={onRemoveImage}>
                            <Trash2 />
                            {_("Remove channel photo")}
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                    void onPickImage(event.target.files?.[0])
                    event.target.value = ""
                }}
            />
        </>
    )
}
