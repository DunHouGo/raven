import { useForm } from "react-hook-form"
import { SAVE_TOAST_ID } from "@lib/toast"
import useSaveHotkey from "@hooks/useSaveHotkey"
import { FrappeError, useFrappeUpdateDoc } from "frappe-react-sdk"
import { toast } from "sonner"
import useCurrentRavenUser from "@raven/lib/hooks/useCurrentRavenUser"
import type { RavenUser } from "@raven/types/Raven/RavenUser"
import { getStatusIndicatorColor } from "@components/features/message/UserAvatar"
import { Button } from "@components/ui/button"
import { Form } from "@components/ui/form"
import { DataField, SelectFormField } from "@components/ui/form-elements"
import { SelectItem } from "@components/ui/select"
import {
    SettingsPanelContent,
    SettingsPanelDescription,
    SettingsPanelHeader,
    SettingsPanelTitle,
} from "@components/ui/settings-dialog"
import { errorResponseToast } from "@components/ui/error-banner"
import { cn } from "@lib/utils"
import _ from "@lib/translate"

/** Lets the Save button live in the panel HEADER, outside the <form>. */
const FORM_ID = "settings-profile-form"

const statusOptions = () => [
    { value: "Available", label: _("Online") },
    { value: "Away", label: _("Away") },
    { value: "Do not disturb", label: _("Do not disturb") },
    { value: "Invisible", label: _("Invisible") },
] as const

type ProfileFormValues = {
    availability_status: string
    custom_status: string
}

/**
 * Desktop Profile panel (v2's UserProfile page + the phone number field).
 * Mobile edits the same fields through EditProfileDrawer — same wire format:
 * one frappe.client.set_value on the Raven User, then my_profile revalidates.
 * The panel mounts fresh each time its tab opens (Radix Tabs unmounts inactive
 * panels), so seeding the form via defaultValues is enough — no reset effects.
 */
const Profile = () => {
    const { myProfile } = useCurrentRavenUser()

    // my_profile is warm from boot in practice; the guard covers a cold cache
    if (!myProfile) return null

    return <ProfileForm myProfile={myProfile} />
}

const ProfileForm = ({ myProfile }: { myProfile: RavenUser }) => {
    const { mutate } = useCurrentRavenUser()
    const { updateDoc } = useFrappeUpdateDoc()

    const form = useForm<ProfileFormValues>({
        defaultValues: {
            availability_status: myProfile.availability_status ?? "",
            custom_status: myProfile.custom_status ?? "",
        },
    })

    const onSubmit = async (values: ProfileFormValues) => {
        updateDoc("Raven User", myProfile.name, {
            availability_status: values.availability_status,
            custom_status: values.custom_status,
        })
            .then(() => {
                toast.success(_("Profile updated"), { id: SAVE_TOAST_ID })
                mutate()
                // The saved values become the new PRISTINE state (Save disables
                // again) — via keepValues, which only swaps the defaults under
                // the untouched inputs. A full reset(values) rewires the mounted
                // controlled fields, and typing after it stopped registering:
                // keystrokes fired input events but the controllers snapped the
                // value back every time. keepValues never touches the fields, so
                // there is nothing to rewire.
                form.reset(values, { keepValues: true })
            }).catch((e) => {
                errorResponseToast(_("Could not update profile"), e as FrappeError, { id: SAVE_TOAST_ID })
            })
    }

    // Same gate as the Save button: nothing to save, or a save in flight, is a no-op.
    useSaveHotkey(() => {
        if (form.formState.isDirty && !form.formState.isSubmitting) form.handleSubmit(onSubmit)()
    })

    return (
        <>
            <SettingsPanelHeader
                actions={
                    <Button
                        type="submit"
                        form={FORM_ID}
                        size="sm"
                        loading={form.formState.isSubmitting}
                        loadingText={_("Saving")}
                        disabled={!form.formState.isDirty}
                    >
                        {_("Save")}
                    </Button>
                }
            >
                <SettingsPanelTitle>{_("Profile")}</SettingsPanelTitle>
                <SettingsPanelDescription>{_("Manage your Raven profile")}</SettingsPanelDescription>
            </SettingsPanelHeader>

            <SettingsPanelContent>
                <div className="flex w-full flex-col gap-6 py-2">
                    <Form {...form}>
                        <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
                            <SelectFormField name="availability_status" label={_("Availability")}>
                                {statusOptions().map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        <span className="flex items-center gap-2">
                                            <span className={cn("size-2 rounded-full", getStatusIndicatorColor(option.value))} />
                                            {option.label}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectFormField>

                            <DataField
                                name="custom_status"
                                label={_("Status")}
                                formDescription={_("Share what you are up to")}
                                inputProps={{ placeholder: _("e.g. Out of office") }}
                                rules={{
                                    maxLength: { value: 140, message: _("Status cannot be more than 140 characters.") },
                                }}
                            />

                        </form>
                    </Form>
                </div>
            </SettingsPanelContent>
        </>
    )
}

export default Profile
