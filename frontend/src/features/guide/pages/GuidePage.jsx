import { useRef, useState } from "react";

import { cn } from "../../../lib/cn";
import { GUIDE_CONTENT } from "../lib/guideContent";
import { GuideHero } from "../components/GuideHero";
import { QuickTour } from "../components/QuickTour";
import { WorkflowMap } from "../components/WorkflowMap";
import { ConceptCards } from "../components/ConceptCards";
import { PublishChecklist } from "../components/PublishChecklist";
import { ManualPublishing } from "../components/ManualPublishing";
import { DefaultsExplainer } from "../components/DefaultsExplainer";
import { PageMap } from "../components/PageMap";
import { WeeklyRoutine } from "../components/WeeklyRoutine";
import { MistakesGrid } from "../components/MistakesGrid";
import { GuideFAQ } from "../components/GuideFAQ";

const SECTION_KEYS = [
  "tour",
  "workflow",
  "concepts",
  "checklist",
  "manual",
  "defaults",
  "pages",
  "routine",
  "mistakes",
  "faq",
];

export function GuidePage() {
  const [lang, setLang] = useState("en");
  const tourRef = useRef(null);
  const sectionRefs = useRef({});

  const content = GUIDE_CONTENT[lang] || GUIDE_CONTENT.en;
  const dir = content.dir || "ltr";

  const scrollToTour = () => {
    tourRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToKey = (key) => {
    sectionRefs.current[key]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const registerRef = (key) => (el) => {
    sectionRefs.current[key] = el;
  };

  return (
    <div dir={dir} className="flex flex-col gap-10">
      <GuideHero
        content={content.hero}
        lang={lang}
        onLangChange={setLang}
        onStartTour={scrollToTour}
      />

      <nav
        aria-label="Guide sections"
        className="-mt-4 flex flex-wrap gap-2"
      >
        {SECTION_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => scrollToKey(key)}
            className={cn(
              "rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-ink transition hover:border-ink/20 hover:bg-canvas",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
            )}
          >
            {content.nav[key]}
          </button>
        ))}
      </nav>

      <div ref={registerRef("tour")}>
        <QuickTour ref={tourRef} content={content.quickTour} />
      </div>

      <div ref={registerRef("workflow")}>
        <WorkflowMap content={content.workflow} />
      </div>

      <div ref={registerRef("concepts")}>
        <ConceptCards content={content.concepts} />
      </div>

      <div ref={registerRef("checklist")}>
        <PublishChecklist content={content.checklist} />
      </div>

      <div ref={registerRef("manual")}>
        <ManualPublishing content={content.manual} />
      </div>

      <div ref={registerRef("defaults")}>
        <DefaultsExplainer content={content.defaults} />
      </div>

      <div ref={registerRef("pages")}>
        <PageMap content={content.pages} />
      </div>

      <div ref={registerRef("routine")}>
        <WeeklyRoutine content={content.routine} />
      </div>

      <div ref={registerRef("mistakes")}>
        <MistakesGrid content={content.mistakes} />
      </div>

      <div ref={registerRef("faq")}>
        <GuideFAQ content={content.faq} />
      </div>
    </div>
  );
}
