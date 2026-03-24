declare module "next/navigation" {
  export function useRouter(): { push: (path: string) => void };
  export function useSearchParams(): { get: (key: string) => string | null };
}

declare module "next/server" {
  export class NextResponse {
    static json(body: unknown, init?: { status?: number }): NextResponse;
    static redirect(url: string | URL): NextResponse;
    static next(): NextResponse;
    headers: {
      set: (name: string, value: string) => void;
    };
  }

  export interface NextRequest {
    headers: {
      get: (name: string) => string | null;
    };
    nextUrl: {
      pathname: string;
    };
    url: string;
  }
}
