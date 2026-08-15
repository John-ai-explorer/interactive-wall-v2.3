import { redirect } from "next/navigation";
import { resolveStoryId } from "@/lib/stories";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function LegacySceneRedirectPage({ params }: Props) {
  const { id } = await params;
  redirect(`/experience/${resolveStoryId(id)}`);
}
