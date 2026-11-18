// Run authentication rules without the Start RPC and route splitting transforms.
export default {
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
  test: {
    include: ["src/lib/admin-access.test.ts", "src/lib/auth-navigation.test.ts", "src/lib/private-routes.test.ts", "src/lib/auth-entry.test.ts"],
  },
};