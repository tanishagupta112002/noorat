import { redirect } from "next/navigation";

export default function AdminOrdersPageRedirect() {
  redirect("/admin/order-assign");
}
