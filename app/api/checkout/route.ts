import { NextResponse } from "next/server";

const BUY_URL = process.env.NEXT_PUBLIC_BUY_URL;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://vc.3vo.ai";

// GET: redirect to payment page
export async function GET() {
  if (BUY_URL) {
    return NextResponse.redirect(BUY_URL);
  }
  return NextResponse.redirect(BASE_URL);
}
