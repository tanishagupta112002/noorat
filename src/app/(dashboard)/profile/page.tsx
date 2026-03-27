// C:\Users\Tanisha Gupta\OneDrive\Desktop\tanitwirl\src\app\(dashboard)\profile\page.tsx
"use client";

import { useSession } from "@/hooks/user-session";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { fetchProfile, updateProfile } from "./_actions/profileActions";
import { deleteAccount } from "./_actions/deleteAccount";
import { ExtendedUser } from "./_types/user";

export default function ProfilePage() {
  const { session, loading } = useSession();
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    alternative_mobile_number: "",
    dob: "",
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteText, setDeleteText] = useState("");

  const applyUserToForm = (user: ExtendedUser) => {
    const nameParts = (user.name || "").trim().split(/\s+/).filter(Boolean);

    setForm({
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
      phone: user.phone || "",
      address: user.address || "",
      city: user.city || "",
      state: user.state || "",
      pincode: user.pincode || "",
      alternative_mobile_number: user.alternative_mobile_number || "",
      dob: user.dob ? new Date(user.dob).toISOString().slice(0, 10) : "",
    });
  };

  const loadProfile = async () => {
    try {
      const user = await fetchProfile();

      if (user) {
        applyUserToForm(user);
      }
    } catch (error) {
      console.error("loadProfile error:", error);
    }
  };

  useEffect(() => {
    if (!loading && !session) {
      router.push("/auth");
      return;
    }

    if (session) {
      void loadProfile();
    }
  }, [session, loading, router]);

  if (loading) return <p>Loading...</p>;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const saveProfile = async () => {
    try {
      const data = await updateProfile(form);

      if (data?.success) {
        setEditing(false);

        if (data.user) {
          applyUserToForm(data.user as ExtendedUser);
        } else {
          await loadProfile();
        }

        router.refresh();
      }
    } catch (error) {
      console.error("Profile update failed:", error);
    }
  };

  const handleDelete = async () => {
    if (deleteText !== "DELETE") return;

    const res = await deleteAccount();

    if (res?.success) {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Personal Information</h1>
          <p className="mt-1 text-muted-foreground">Manage your profile details</p>
        </div>
        {!editing ? (
          <button 
            onClick={() => setEditing(true)} 
            className="rounded-sm border border-[#d9d9d9] bg-white px-6 py-2 font-medium text-foreground transition hover:bg-[#fafafa]"
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={saveProfile}
              className="rounded-sm bg-primary px-6 py-2 font-medium text-primary-foreground transition hover:opacity-90"
            >
              Save Changes
            </button>
            <button 
              onClick={() => setEditing(false)} 
              className="rounded-sm border border-[#d9d9d9] px-6 py-2 font-medium text-foreground transition hover:bg-[#fafafa]"
            >
              Cancel
            </button>
          </div>
        )}
      </div>



      {/* Full Name */}
      <div className="rounded-sm border border-[#ececec] bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Full Name</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">First Name</label>
          <input
            name="firstName"
            value={form.firstName}
            disabled={!editing}
            onChange={handleChange}
              placeholder="First name"
              className="w-full rounded-2xl border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground disabled:bg-muted disabled:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Last Name</label>
          <input
            name="lastName"
            value={form.lastName}
            disabled={!editing}
            onChange={handleChange}
              placeholder="Last name"
              className="w-full rounded-2xl border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground disabled:bg-muted disabled:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          </div>
        </div>
      </div>

      {/* Phone Number */}
      <div className="rounded-sm border border-[#ececec] bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Mobile Number</h2>
        <input
          name="phone"
          value={form.phone}
          disabled={!editing}
          onChange={handleChange}
          placeholder="10-digit mobile number"
          className="w-full rounded-2xl border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground disabled:bg-muted disabled:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Address */}
      <div className="rounded-sm border border-[#ececec] bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Address</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Address Line</label>
          <input
            name="address"
            value={form.address}
            disabled={!editing}
            onChange={handleChange}
              placeholder="Street address"
              className="w-full rounded-2xl border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground disabled:bg-muted disabled:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">City</label>
          <input
            name="city"
            value={form.city}
            disabled={!editing}
            onChange={handleChange}
            placeholder="City"
                className="w-full rounded-2xl border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground disabled:bg-muted disabled:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">State</label>
          <input
            name="state"
            value={form.state}
            disabled={!editing}
            onChange={handleChange}
            placeholder="State"
                className="w-full rounded-2xl border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground disabled:bg-muted disabled:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Pincode</label>
          <input
            name="pincode"
            value={form.pincode}
            disabled={!editing}
            onChange={handleChange}
              placeholder="6-digit pincode"
              className="w-full rounded-2xl border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground disabled:bg-muted disabled:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          </div>
        </div>
      </div>

      {/* Alternate Phone */}
      <div className="rounded-sm border border-[#ececec] bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Alternate Mobile Number</h2>
        <input
          name="alternative_mobile_number"
          value={form.alternative_mobile_number}
          disabled={!editing}
          onChange={handleChange}
          placeholder="Optional alternate mobile"
          className="w-full rounded-2xl border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground disabled:bg-muted disabled:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Date of Birth */}
      <div className="rounded-sm border border-[#ececec] bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Date of Birth</h2>
        <input
          type="date"
          name="dob"
          value={form.dob}
          disabled={!editing}
          onChange={handleChange}
          className="w-full rounded-2xl border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground disabled:bg-muted disabled:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>


      {/* Delete Account */}
      <div className="rounded-3xl border border-destructive/30 bg-destructive/10 p-6">
        <h2 className="mb-2 text-lg font-semibold text-destructive">Delete Account</h2>
        <p className="mb-4 text-sm text-destructive">This action is permanent and cannot be undone.</p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="rounded-2xl bg-destructive px-6 py-2 font-medium text-white transition hover:opacity-90"
        >
          Delete Account
        </button>
      </div>
      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl space-y-6 p-8">
            <div>
              <h2 className="text-2xl font-bold text-destructive">Delete Account</h2>
              <p className="mt-2 text-sm text-muted-foreground">This action is permanent and cannot be undone.</p>
            </div>

            <div>
              <p className="mb-3 text-sm text-foreground">
                Type <span className="font-bold">DELETE</span> to confirm:
              </p>
            <input
              type="text"
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              placeholder="Type DELETE"
                className="w-full rounded-2xl border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-sm border border-[#d9d9d9] px-6 py-2 font-medium text-foreground transition hover:bg-[#fafafa]"
              >
                Cancel
              </button>

              <button
                disabled={deleteText !== "DELETE"}
                onClick={handleDelete}
                className="rounded-2xl bg-destructive px-6 py-2 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
