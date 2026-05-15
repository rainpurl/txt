// Pages Function: /api/health
// Public diagnostic — confirms functions are deployed and reports binding state.
// Does NOT leak the actual passphrase, only whether the env var is set.

export const onRequestGet = async ({ env }) => {
  return Response.json({
    ok: true,
    kv_bound: !!env.TXT,
    passphrase_set: !!env.PASSPHRASE,
    passphrase_is_default: !env.PASSPHRASE,
    time: new Date().toISOString(),
  });
};
