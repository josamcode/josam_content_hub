import { useTranslation } from "react-i18next";

import { Textarea } from "../../../components/ui/Textarea";

const PLATFORM_KEYS = ["youtube", "instagram", "facebook", "tiktok"];

export function PlatformInstructionsEditor({ value = {}, onChange }) {
  const { t } = useTranslation("pages");

  const handleField = (platform, val) => {
    onChange({ ...value, [platform]: val });
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {PLATFORM_KEYS.map((platform) => (
        <Textarea
          key={platform}
          label={t(`aiBrandProfile.fields.platformInstructions.${platform}.label`, {
            defaultValue: platform,
          })}
          rows={3}
          placeholder={t(`aiBrandProfile.fields.platformInstructions.${platform}.placeholder`, {
            defaultValue: "",
          })}
          value={value[platform] || ""}
          onChange={(e) => handleField(platform, e.target.value)}
        />
      ))}
    </div>
  );
}
