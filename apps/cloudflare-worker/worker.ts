export default {
  fetch() {
    return new Response("OK");
  },
} satisfies ExportedHandler<Env>;
