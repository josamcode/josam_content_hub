import { PlatformComposerForm } from "./PlatformComposerForm";

const FACEBOOK_FIELDS = [
  {
    name: "caption",
    kind: "textarea",
    label: "Caption",
    rows: 8,
    placeholder: "Your Facebook post copy.",
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

export function FacebookPostForm({ post, contentItemId }) {
  return (
    <PlatformComposerForm
      post={post}
      contentItemId={contentItemId}
      fields={FACEBOOK_FIELDS}
    />
  );
}
