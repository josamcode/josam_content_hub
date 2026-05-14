import { useRef } from "react";
import { useTranslation } from "react-i18next";

import { PlatformComposerForm } from "./PlatformComposerForm";

export function YouTubePostForm({ post, contentItemId, category }) {
  const { t } = useTranslation("pages");
  const fieldsRef = useRef([
    { name: "title", kind: "input", label: "", placeholder: "", hint: "" },
    {
      name: "description",
      kind: "textarea",
      label: "",
      rows: 10,
      placeholder: "",
    },
    {
      name: "tags",
      kind: "tags",
      label: "",
      placeholder: "",
      hint: "",
      copyLabel: "",
    },
  ]);
  const fields = fieldsRef.current;

  fields[0].label = t("contentDetail.composer.forms.youtube.title.label");
  fields[0].placeholder = t(
    "contentDetail.composer.forms.youtube.title.placeholder"
  );
  fields[0].hint = t("contentDetail.composer.forms.youtube.title.hint");
  fields[1].label = t(
    "contentDetail.composer.forms.youtube.description.label"
  );
  fields[1].placeholder = t(
    "contentDetail.composer.forms.youtube.description.placeholder"
  );
  fields[2].label = t("contentDetail.composer.forms.youtube.tags.label");
  fields[2].placeholder = t(
    "contentDetail.composer.forms.youtube.tags.placeholder"
  );
  fields[2].hint = t("contentDetail.composer.forms.youtube.tags.hint");
  fields[2].copyLabel = t(
    "contentDetail.composer.forms.youtube.tags.copyLabel"
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
