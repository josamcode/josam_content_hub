import { PlatformComposerForm } from "./PlatformComposerForm";

const YOUTUBE_FIELDS = [
  {
    name: "title",
    kind: "input",
    label: "Title",
    placeholder: "The video title viewers will see",
    hint: "Required to mark this version as ready.",
  },
  {
    name: "description",
    kind: "textarea",
    label: "Description",
    rows: 10,
    placeholder: "Long-form description, links, timestamps.",
  },
  {
    name: "tags",
    kind: "tags",
    label: "Tags",
    placeholder: "Type a tag and press Enter",
    hint: "Plain keywords without #. Press Enter or comma to add.",
    copyLabel: "Copy tags",
  },
];

export function YouTubePostForm({ post, contentItemId }) {
  return (
    <PlatformComposerForm
      post={post}
      contentItemId={contentItemId}
      fields={YOUTUBE_FIELDS}
    />
  );
}
