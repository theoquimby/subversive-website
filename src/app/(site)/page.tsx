import { PageWipe } from "@/components/layout/PageWipe";
import { getSite } from "@/lib/site/site";

// Home is built in M6. Until then the shell stands on its own; the page has its h1.
export const revalidate = 300;

export default function Home() {
  const site = getSite();
  return (
    <PageWipe>
      <div className="page page--home-pending">
        <h1 className="sr-only">{site.name}</h1>
      </div>
    </PageWipe>
  );
}
