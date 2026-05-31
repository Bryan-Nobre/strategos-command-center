import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/lgpd/$code/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/lgpd/$code/termo",
      params: { code: params.code },
      replace: true,
    });
  },
});
