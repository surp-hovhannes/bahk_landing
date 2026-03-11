import type { APIRoute } from "astro";

function getTodayInPacific(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export const GET: APIRoute = ({ redirect }) => {
  const today = getTodayInPacific();
  return redirect(`/readings/${today}`, 302);
};

export const HEAD: APIRoute = ({ redirect }) => {
  const today = getTodayInPacific();
  return redirect(`/readings/${today}`, 302);
};
