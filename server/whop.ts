import Whop from "@whop/sdk";
import { ENV } from "./_core/env";

let _whop: InstanceType<typeof Whop> | null = null;
let _whopSandbox: boolean | null = null;

export function getWhop(forceSandbox?: boolean) {
  const useSandbox = forceSandbox ?? ENV.whopSandbox;
  // Re-create client if sandbox mode changed
  if (_whop && _whopSandbox !== useSandbox) {
    _whop = null;
  }
  if (!_whop) {
    const apiKey = useSandbox ? (ENV.whopSandboxApiKey || ENV.whopApiKey) : ENV.whopApiKey;
    if (!apiKey) {
      throw new Error(useSandbox ? "WHOP_SANDBOX_API_KEY is not configured" : "WHOP_API_KEY is not configured");
    }
    _whopSandbox = useSandbox;
    _whop = new Whop({
      apiKey,
      ...(useSandbox ? { baseURL: "https://sandbox-api.whop.com/api/v1" } : {}),
    });
  }
  return _whop;
}
