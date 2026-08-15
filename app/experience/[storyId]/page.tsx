import { notFound } from "next/navigation";
import ExperienceShell from "@/components/experience/ExperienceShell";
import { getAllStories, getStoryById } from "@/lib/stories";

type Props = {
  params: Promise<{ storyId: string }>;
  searchParams: Promise<{ from?: string }>;
};

export function generateStaticParams() {
  return getAllStories().map((story) => ({ storyId: story.id }));
}

export async function generateMetadata({ params }: Props) {
  const { storyId } = await params;
  const story = getStoryById(storyId);
  return {
    title: story ? `${story.title} | 故事沉浸体验` : "故事沉浸体验",
    description: story?.description,
  };
}

export default async function ExperiencePage({ params, searchParams }: Props) {
  const { storyId } = await params;
  const { from } = await searchParams;
  const story = getStoryById(storyId);

  if (!story) notFound();

  return <ExperienceShell story={story} fromScan={from === "scan"} />;
}
