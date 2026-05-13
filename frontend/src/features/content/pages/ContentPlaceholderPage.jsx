import { Link, useParams } from "react-router-dom";

import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { PageHeader } from "../../../components/shared/PageHeader";

function ArrowLeftIcon() {
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
      <path d="M19 12H5" />
      <path d="m11 19-7-7 7-7" />
    </svg>
  );
}

export function ContentPlaceholderPage({ mode }) {
  const params = useParams();
  const isCreate = mode === "create";

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={isCreate ? "Create" : "Detail"}
        title={isCreate ? "Create Content" : "Content Detail"}
        subtitle={
          isCreate
            ? "The create flow is coming in a later phase."
            : "Full content detail view is coming in a later phase."
        }
        actions={
          <Button as={Link} to="/content" variant="outline" size="sm">
            <ArrowLeftIcon />
            Back to library
          </Button>
        }
      />

      <Card padding="lg" className="flex flex-col gap-3">
        <Badge tone="accent">Phase placeholder</Badge>
        <p className="text-sm text-muted">
          {isCreate
            ? "This route is reserved for the Create Content form. Until that phase ships, you can browse and filter the library."
            : "This route is reserved for the per-item detail page. Until that phase ships, you can browse and filter the library."}
        </p>
        {!isCreate && params.id && (
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
            Requested ID: <span className="text-ink">{params.id}</span>
          </p>
        )}
      </Card>
    </div>
  );
}
