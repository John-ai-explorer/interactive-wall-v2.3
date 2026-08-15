import storiesData from "@/data/stories.v2.json";
import type { StoryExperience } from "@/lib/types";

type StoriesFile = {
  version: string;
  stories: StoryExperience[];
};

const typedStoriesData = storiesData as StoriesFile;

export const STORIES_V2_VERSION = typedStoriesData.version;

export const stories = typedStoriesData.stories;

export function getAllStories(): StoryExperience[] {
  return stories;
}

export function getStoryById(storyId: string): StoryExperience | undefined {
  return stories.find(
    (story) => story.id === storyId || story.legacyIds.includes(storyId)
  );
}

export function resolveStoryId(input: string): string {
  return getStoryById(input)?.id ?? input;
}

export function getStoryAssetBase(story: StoryExperience): string {
  return `/assets/stories/${story.id === "qian-xuesen" ? "qian_xuesen" : story.id}`;
}

export function getImprintBackground(story: StoryExperience): string {
  return `${getStoryAssetBase(story)}/imprint_card_bg.png`;
}
