import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Welcome back</p>
        <h1>Log in to Melodia</h1>
      </section>
      <SignIn />
    </main>
  );
}
