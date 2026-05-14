import { useRef } from "react";
import { useTranslation } from "react-i18next";

import { PlatformComposerForm } from "./PlatformComposerForm";

export function InstagramPostForm({ post, contentItemId, category }) {
  const { t } = useTranslation("pages");
  const fieldsRef = useRef([
    {
      name: "caption",
      kind: "textarea",
      label: "",
      rows: 8,
      maxLength: 2200,
      placeholder: "",
      hint: "",
    },
    {
      name: "hashtags",
      kind: "tags",
      label: "",
      prefix: "#",
      placeholder: "",
      hint: "",
      copyLabel: "",
    },
  ]);
  const fields = fieldsRef.current;

  fields[0].label = t(
    "contentDetail.composer.forms.instagram.caption.label"
  );
  fields[0].placeholder = t(
    "contentDetail.composer.forms.instagram.caption.placeholder"
  );
  fields[0].hint = t("contentDetail.composer.forms.instagram.caption.hint");
  fields[1].label = t(
    "contentDetail.composer.forms.instagram.hashtags.label"
  );
  fields[1].placeholder = t(
    "contentDetail.composer.forms.instagram.hashtags.placeholder"
  );
  fields[1].hint = t("contentDetail.composer.forms.instagram.hashtags.hint");
  fields[1].copyLabel = t(
    "contentDetail.composer.forms.instagram.hashtags.copyLabel"
  );

  return (
    <PlatformComposerForm
      post={post}
      contentItemId={contentItemId}
      fields={fields}
      category={category}
    />
  );
}
