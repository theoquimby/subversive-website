import site from "@content/site.json";

// M0: a blank Paper page under the checker rail. The home page is built in M6.
export const revalidate = 300;

export default function Home() {
  return (
    <main id="main" className="min-h-[100svh]">
      <h1 className="sr-only">{site.name}</h1>
    </main>
  );
}
