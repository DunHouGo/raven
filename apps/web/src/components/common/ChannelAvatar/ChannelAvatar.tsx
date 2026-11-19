import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar"
import { ChannelIcon } from "@components/common/ChannelIcon/ChannelIcon"
import type { ChannelListItem } from "@raven/types/common/ChannelListItem"
import { cn } from "@lib/utils"

type ChannelAvatarProps = {
    type: ChannelListItem["type"]
    image?: string
    className?: string
    iconClassName?: string
}

/** Displays a custom channel image and falls back to the channel type icon. */
export function ChannelAvatar({ type, image, className, iconClassName }: ChannelAvatarProps) {
    return (
        <Avatar className={cn("rounded-md", className)}>
            <AvatarImage src={image} alt="" className="rounded-md" />
            <AvatarFallback className="rounded-md">
                <ChannelIcon type={type || "Public"} className={cn("size-3/4", iconClassName)} />
            </AvatarFallback>
        </Avatar>
    )
}
