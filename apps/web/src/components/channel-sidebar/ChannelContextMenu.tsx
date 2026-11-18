import { useFrappePostCall, type FrappeError } from "frappe-react-sdk"
import { Bell, BellOff, ExternalLink, Star, StarOff } from "lucide-react"
import { useCallback, type ReactNode } from "react"
import { ContextMenu, ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuSeparator, ContextMenuTrigger } from "@components/ui/context-menu"
import { errorResponseToast } from "@components/ui/error-banner"
import { useChannel } from "@hooks/useChannel"
import { channelStore } from "@stores/channels/store"
import type { ChannelListItem } from "@raven/types/common/ChannelListItem"
import { siteUrl } from "@lib/site"
import _ from "@lib/translate"

type ChannelContextMenuProps = {
    channel: ChannelListItem
    children: ReactNode
}

/** Adds consistent channel actions to both the channel and DM sidebars. */
export function ChannelContextMenu({ channel, children }: ChannelContextMenuProps) {
    const { isStarred, toggleStarChannel } = useChannel(channel.name)
    const { call: setMemberValue } = useFrappePostCall("frappe.client.set_value")
    const muted = channel.muted === 1

    const toggleFavorite = useCallback(async () => {
        try {
            await toggleStarChannel()
        } catch (error) {
            errorResponseToast(isStarred ? _("Could not remove from favorites") : _("Could not add to favorites"), error as FrappeError)
        }
    }, [isStarred, toggleStarChannel])

    const setMuted = useCallback(async (next: boolean) => {
        if (!channel.member_id || muted === next) return
        channelStore.patchChannel(channel.name, { muted: next ? 1 : 0 })
        try {
            await setMemberValue({
                doctype: "Raven Channel Member",
                name: channel.member_id,
                fieldname: { muted: next ? 1 : 0 },
            })
        } catch (error) {
            channelStore.patchChannel(channel.name, { muted: muted ? 1 : 0 })
            errorResponseToast(next ? _("Could not mute channel") : _("Could not unmute channel"), error as FrappeError)
        }
    }, [channel.member_id, channel.name, muted, setMemberValue])

    const openInWindow = useCallback(() => {
        const path = channel.is_direct_message
            ? `/raven/dm-channel/${encodeURIComponent(channel.name)}`
            : `/raven/${encodeURIComponent(channel.workspace ?? "")}/${encodeURIComponent(channel.name)}`
        window.open(siteUrl(path), `raven-${channel.name}`, "popup=yes,width=1100,height=760,resizable=yes")
    }, [channel])

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
            <ContextMenuContent className="w-56">
                <ContextMenuLabel className="truncate">{channel.channel_name}</ContextMenuLabel>
                <ContextMenuSeparator />
                <ContextMenuCheckboxItem checked={isStarred} onCheckedChange={() => void toggleFavorite()}>
                    {isStarred ? <StarOff /> : <Star />}
                    <span>{isStarred ? _("Remove from Favorites") : _("Add to Favorites")}</span>
                </ContextMenuCheckboxItem>
                {channel.member_id && (
                    <ContextMenuCheckboxItem checked={muted} onCheckedChange={(checked) => void setMuted(checked)}>
                        {muted ? <Bell /> : <BellOff />}
                        <span>{muted ? _("Unmute Channel") : _("Mute Channel")}</span>
                    </ContextMenuCheckboxItem>
                )}
                <ContextMenuSeparator />
                <ContextMenuItem onSelect={openInWindow}>
                    <ExternalLink />
                    <span>{_("Open in new window")}</span>
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    )
}
