import { PlatformComposerForm } from "./PlatformComposerForm";

const TIKTOK_FIELDS = [
  {
    name: "caption",
    kind: "textarea",
    label: "Caption",
    rows: 8,
    placeholder: "Your TikTok caption.",
    hint: "Required to mark this version as ready.",
  },
  {
    name: "hashtags",
    kind: "tags",
    label: "Hashtags",
    prefix: "#",
    placeholder: "Type a hashtag and press Enter",
    hint: "Press Enter or comma to add.",
    copyLabel: "Copy hashtags",
  },
];

export function TikTokPostForm({ post, contentItemId }) {
  return (
    <PlatformComposerForm
      post={post}
      contentItemId={contentItemId}
      fields={TIKTOK_FIELDS}
    />
  );
}
