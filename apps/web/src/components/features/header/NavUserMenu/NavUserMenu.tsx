import { Bell, SettingsIcon, CreditCard, Check } from "lucide-react"
import { UserAvatar } from "@components/features/message/UserAvatar"
import { Button } from "@components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@components/ui/dropdown-menu"
import { availabilityOptions, useSetAvailability, type AvailabilityStatus } from "@hooks/useSetAvailability"
import { getStatusIndicatorColor } from "@components/features/message/UserAvatar"
import { cn } from "@lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip"
import _ from "@lib/translate"
import useCurrentRavenUser from "@raven/lib/hooks/useCurrentRavenUser"
import { useUserCookieData } from "@hooks/useUserCookieData"
import { useEffect, useMemo, useState } from "react"
import { UserData } from "@db"
import { useSetAtom } from "jotai"
import { settingsDialogOpenTab } from "@components/features/settings/settingsDialogAtom"
import { disablePush, enablePush, isPushEnabled } from "@lib/push"
import { toast } from "sonner"
import { getErrorMessage } from "@lib/frappe"
import { useFrappePostCall, type FrappeError } from "frappe-react-sdk"
import { useIsPushNotificationEnabled } from "@hooks/fetchers/useIsPushNotificationEnabled"
import { Spinner } from "@components/ui/spinner"
import { useCloudSettings } from "@hooks/useCloudSettings"
import { Input } from "@components/ui/input"
import { errorResponseToast } from "@components/ui/error-banner"

const NavUserMenu = () => {

    const setOpenSettingsDialog = useSetAtom(settingsDialogOpenTab)

    const { myProfile } = useCurrentRavenUser()

    const userCookieData = useUserCookieData()

    const userData: UserData = useMemo(() => {
        if (myProfile) {
            return myProfile
        }
        return {
            name: userCookieData.name,
            full_name: userCookieData.full_name,
            user_image: userCookieData.user_image,
            type: 'User',
            availability_status: '',
            custom_status: '',
            enabled: 1,
            first_name: userCookieData.full_name?.split(' ')?.[0],
        }
    }, [myProfile, userCookieData])

    const isPushAvailable = useIsPushNotificationEnabled()

    // Only on a Frappe Cloud site, and only for users who may manage it (boot decides).
    const { available: canManageBilling, opening: openingBilling, open: openBilling } = useCloudSettings()
    const manageBilling = () =>
        openBilling().catch((error: unknown) =>
            toast.error(error instanceof Error ? error.message : _("Could not open Cloud Settings")),
        )

    // Source of truth for "enabled on this device" is the stored FCM token (lib/push).
    const [pushOn, setPushOn] = useState<boolean>(() => isPushEnabled())

    const togglePush = (next: boolean) => {
        if (next) {
            toast.promise(
                enablePush().then((granted) => {
                    if (!granted) { setPushOn(false); throw new Error(_("Permission denied for push notifications")) }
                    setPushOn(true)
                }),
                { loading: _("Enabling…"), success: _("Push notifications enabled"), error: (e: Error) => e.message },
            )
        } else {
            disablePush()
                .then(() => { setPushOn(false); toast.info(_("Push notifications disabled")) })
                .catch((e: unknown) => toast.error(_("There was an error"), { description: getErrorMessage(e as FrappeError) }))
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" isIconButton aria-label={_("Your Profile")}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <UserAvatar user={userData} size="md" className="rounded-full" showStatusIndicator={true} showBotIndicator={false} addColoredFallback={false} />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{_("Your Profile")}</p>
                        </TooltipContent>
                    </Tooltip>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-72 min-w-56"
                side="right"
                align="end"
                sideOffset={12}
                collisionPadding={16}
            >
                <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 p-1.5 text-left text-sm">
                        <UserAvatar user={userData} size="md" className="rounded-full" showStatusIndicator={true} showBotIndicator={false} addColoredFallback={false} />
                        <div className="flex flex-col gap-0.5 text-left text-sm">
                            <span className="truncate font-semibold text-ink-gray-8">{userData.full_name}</span>
                            <span className="truncate text-xs text-ink-gray-5">{userData.name}</span>
                        </div>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <CustomStatusEditor />
                <DropdownMenuSeparator />
                <AvailabilityPicker />
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setOpenSettingsDialog("appearance")}>
                    <SettingsIcon />
                    <span>{_("Settings")}</span>
                </DropdownMenuItem>
                {canManageBilling && <DropdownMenuItem disabled={openingBilling} onClick={manageBilling}>
                    <CreditCard />
                    <span>{_("Manage Billing")}</span>
                </DropdownMenuItem>}
                {isPushAvailable && <DropdownMenuItem onClick={() => togglePush(!pushOn)}>
                    <Bell />
                    <span>{pushOn ? _("Disable Notifications") : _("Enable Notifications")}</span>
                </DropdownMenuItem>}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

/** Edit the short status message directly from the avatar menu. */
const CustomStatusEditor = () => {
    const { myProfile, mutate } = useCurrentRavenUser()
    const { call, loading } = useFrappePostCall("frappe.client.set_value")
    const [value, setValue] = useState(myProfile?.custom_status ?? "")

    useEffect(() => setValue(myProfile?.custom_status ?? ""), [myProfile?.custom_status])

    const save = async () => {
        const status = value.trim()
        if (!myProfile?.name || status === (myProfile.custom_status ?? "")) return
        try {
            await call({ doctype: "Raven User", name: myProfile.name, fieldname: "custom_status", value: status })
            await mutate()
            toast.success(_("Status updated"))
        } catch (error) {
            errorResponseToast(_("Could not update status"), error as FrappeError)
        }
    }

    return (
        <div className="flex items-center gap-2 px-2 py-1.5">
            <Input
                aria-label={_("Status message")}
                placeholder={_("Set a status")}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                onKeyDown={(event) => {
                    event.stopPropagation()
                    if (event.key === "Enter") {
                        event.preventDefault()
                        void save()
                    }
                }}
                className="h-9 min-w-0"
            />
            <Button
                type="button"
                variant="subtle"
                size="sm"
                isIconButton
                aria-label={_("Save status")}
                title={_("Save status")}
                disabled={loading || value.trim() === (myProfile?.custom_status ?? "")}
                onClick={save}
            >
                {loading ? <Spinner /> : <Check />}
            </Button>
        </div>
    )
}

/** Show every availability choice in the avatar menu without a nested submenu. */
const AvailabilityPicker = () => {
    const { availability, setAvailability } = useSetAvailability()

    return (
        <>
            <DropdownMenuLabel className="text-xs text-ink-gray-5">{_("Availability")}</DropdownMenuLabel>
            <DropdownMenuRadioGroup
                value={availability}
                onValueChange={(value) => setAvailability(value as AvailabilityStatus)}
            >
                {availabilityOptions().map((option) => (
                    <DropdownMenuRadioItem key={option.value} value={option.value}>
                            <span className="flex size-4 shrink-0 items-center justify-center">
                                <span className={cn("size-2 rounded-full", getStatusIndicatorColor(option.value))} />
                            </span>
                        {option.label}
                    </DropdownMenuRadioItem>
                ))}
            </DropdownMenuRadioGroup>
        </>
    )
}

export default NavUserMenu

