import { Link } from "react-router-dom";

import { Card } from "../../../components/ui/Card";

export function PageMap({ content }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
          {content.eyebrow}
        </span>
        <h2 className="font-display text-2xl leading-tight text-ink">
          {content.title}
        </h2>
        <p className="text-sm text-muted">{content.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {content.cards.map((card) => (
          <Card key={card.name} padding="md" className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-ink">{card.name}</h3>
            <p className="text-sm text-muted">{card.purpose}</p>
            <p className="text-xs text-muted">{card.when}</p>
            <div className="pt-1">
              <Link
                to={card.link}
                className="text-[11px] font-medium text-accent hover:underline"
              >
                {content.open} →
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
