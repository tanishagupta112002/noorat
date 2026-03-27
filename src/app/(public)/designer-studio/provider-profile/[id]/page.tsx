import { permanentRedirect } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DesignerStudioProfileRedirectPage({ params }: PageProps) {
  const { id } = await params;
  permanentRedirect(`/designer-studios/provider-profile/${id}`);
}
