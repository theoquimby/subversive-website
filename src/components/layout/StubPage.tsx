// A page that exists before its milestone: its real title and nothing invented (plan M2
// item 8). Each page fills in during its milestone (menu M3, visit M4, events M5…).
import { PageWipe } from "./PageWipe";

export function StubPage({ title }: { title: string }) {
  return (
    <PageWipe>
      <div className="page page--stub">
        <h1 className="page__title">{title}</h1>
      </div>
    </PageWipe>
  );
}
