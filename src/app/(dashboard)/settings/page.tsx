export default function SettingsPage() {
  return (
    <div>
      <div>
        <h1 className="text-xl font-bold text-foreground">Account Settings</h1>
        <p className="mt-2 text-muted-foreground">Manage your account preferences</p>
      </div>


      <div className="mt-8 space-y-4">
        <div className="rounded-sm border border-[#ececec] bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-foreground">Change Password</h2>
          <p className="mb-4 text-sm text-muted-foreground">Update your password to keep your account secure</p>
          <button className="rounded-sm border border-[#d9d9d9] px-6 py-2 font-medium text-foreground transition hover:bg-[#fafafa]">
            Change Password
          </button>
        </div>

        <div className="rounded-sm border border-[#ececec] bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-foreground">Preferences</h2>
          <p className="mb-4 text-sm text-muted-foreground">Manage your notification and privacy settings</p>
          <button className="rounded-sm border border-[#d9d9d9] px-6 py-2 font-medium text-foreground transition hover:bg-[#fafafa]">
            Edit Preferences
          </button>
        </div>
      </div>
    </div>
  );
}