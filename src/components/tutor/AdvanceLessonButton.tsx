"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdvanceLessonButton({ isLastLesson }: { isLastLesson: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function advance() {
    setLoading(true);
    await fetch("/api/lesson-plan/advance", { method: "POST" });
    router.refresh();
    setLoading(false);
  }

  if (isLastLesson) {
    return <p className="lesson-complete-note">You've reached the end of this plan — nice work!</p>;
  }

  return (
    <button className="button" type="button" onClick={advance} disabled={loading}>
      {loading ? "Saving..." : "Mark complete & continue"}
    </button>
  );
}
