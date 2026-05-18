import { useTranslation } from "react-i18next";

import { Badge } from "../../../components/ui/Badge";
import { Card, CardDescription, CardHeader, CardTitle } from "../../../components/ui/Card";

function InfoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8h.01" />
      <path d="M11 12h1v5h1" />
    </svg>
  );
}

function SummaryRow({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 text-sm text-ink">{value}</p>
    </div>
  );
}

function SummaryList({ label, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <div className="mt-1 flex flex-wrap gap-1">
        {items.map((item) => (
          <Badge key={item} tone="neutral">
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function AiBrandProfilePreview({ profile }) {
  const { t } = useTranslation("pages");

  if (!profile) return null;

  return (
    <div className="flex flex-col gap-5">
      <Card padding="lg">
        <CardHeader>
          <CardTitle>
            {t("aiBrandProfile.preview.title", { defaultValue: "Profile summary" })}
          </CardTitle>
          <CardDescription>
            {t("aiBrandProfile.preview.description", {
              defaultValue: "How future AI generation will write your content.",
            })}
          </CardDescription>
        </CardHeader>

        <div className="flex flex-col gap-3">
          <SummaryRow
            label={t("aiBrandProfile.fields.audience.label", { defaultValue: "Audience" })}
            value={profile.audience}
          />
          <SummaryRow
            label={t("aiBrandProfile.fields.tone.label", { defaultValue: "Tone" })}
            value={profile.tone}
          />
          <SummaryRow
            label={t("aiBrandProfile.fields.language.label", { defaultValue: "Language" })}
            value={profile.language}
          />
          <SummaryRow
            label={t("aiBrandProfile.fields.contentGoal.label", { defaultValue: "Content goal" })}
            value={profile.contentGoal}
          />
          <SummaryRow
            label={t("aiBrandProfile.fields.ctaStyle.label", { defaultValue: "CTA style" })}
            value={profile.ctaStyle}
          />

          <SummaryList
            label={t("aiBrandProfile.fields.forbiddenWords.label", { defaultValue: "Forbidden words" })}
            items={profile.forbiddenWords}
          />
          <SummaryList
            label={t("aiBrandProfile.fields.hashtagBank.label", { defaultValue: "Hashtag bank" })}
            items={profile.hashtagBank}
          />
          <SummaryList
            label={t("aiBrandProfile.fields.servicesToPromote.label", { defaultValue: "Services to promote" })}
            items={profile.servicesToPromote}
          />
          <SummaryList
            label={t("aiBrandProfile.fields.courseTopics.label", { defaultValue: "Course topics" })}
            items={profile.courseTopics}
          />
        </div>
      </Card>

      <Card padding="md" className="border-amber-200 bg-amber-50">
        <div className="flex items-start gap-2.5 text-amber-900">
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white"
          >
            <InfoIcon />
          </span>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em]">
              {t("aiBrandProfile.preview.noticeEyebrow", { defaultValue: "Coming later" })}
            </p>
            <p className="mt-0.5 text-sm">
              {t("aiBrandProfile.preview.noticeBody", {
                defaultValue: "AI metadata generation is coming later. No AI API is called from this page.",
              })}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
