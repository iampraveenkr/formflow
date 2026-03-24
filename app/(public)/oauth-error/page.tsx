import Link from "next/link";

export default function OauthErrorPage(): JSX.Element {
  return (
    <section className="w-full rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-red-800">Google sign-in failed</h1>
      <p className="mt-2 text-sm text-red-700">Permission was denied or authentication did not complete.</p>
      <Link className="mt-4 inline-block text-sm font-medium text-red-800 underline" href="/login">
        Return to login
      </Link>
    </section>
  );
}
