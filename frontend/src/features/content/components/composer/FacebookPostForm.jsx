import { useRef } from "react";
import { useTranslation } from "react-i18next";

import { PlatformComposerForm } from "./PlatformComposerForm";

export function FacebookPostForm({ post, contentItemId, category }) {
  const { t } = useTranslation("pages");
  const fieldsRef = useRef([
    {
      name: "caption",
      kind: "textarea",
      label: "",
      rows: 8,
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

  fields[0].label = t("contentDetail.composer.forms.facebook.caption.label");
  fields[0].placeholder = t(
    "contentDetail.composer.forms.facebook.caption.placeholder"
  );
  fields[0].hint = t("contentDetail.composer.forms.facebook.caption.hint");
  fields[1].label = t("contentDetail.composer.forms.facebook.hashtags.label");
  fields[1].placeholder = t(
    "contentDetail.composer.forms.facebook.hashtags.placeholder"
  );
  fields[1].hint = t("contentDetail.composer.forms.facebook.hashtags.hint");
  fields[1].copyLabel = t(
    "contentDetail.composer.forms.facebook.hashtags.copyLabel"
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
