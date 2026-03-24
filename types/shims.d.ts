declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: unknown;
  }

  type Element = unknown;
}

declare const process: {
  env: Record<string, string | undefined>;
};

declare module "next" {
  export interface Metadata {
    title?: string;
    description?: string;
  }
}

declare module "next/link" {
  export default function Link(props: {
    key?: string;
    href: string;
    className?: string;
    children?: unknown;
  }): unknown;
}

declare module "next/server" {
  export class NextResponse {
    static json(value: unknown): NextResponse;
  }
}
