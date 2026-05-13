import { PlatformComposerForm } from "./PlatformComposerForm";

const INSTAGRAM_FIELDS = [
  {
    name: "caption",
    kind: "textarea",
    label: "Caption",
    rows: 8,
    maxLength: 2200,
    placeholder: "Your Instagram caption.",
    hint: "Required to mark this version as ready. Max 2,200 characters.",
  },
  {
    name: "hashtags",
    kind: "tags",
    label: "Hashtags",
    prefix: "#",
    placeholder: "Type a hashtag and press Enter",
    hint: "Press Enter or comma to add. Don't include the # — it's added for you.",
    copyLabel: "Copy hashtags",
  },
];

export function InstagramPostForm({ post, contentItemId }) {
  return (
    <PlatformComposerForm
      post={post}
      contentItemId={contentItemId}
      fields={INSTAGRAM_FIELDS}
    />
  );
}
