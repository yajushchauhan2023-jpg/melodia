"use client";

export function ErrorPanel({ message, onTryAgain }: { message: string; onTryAgain: () => void }) {
  return (
    <div className="card decoder-error-card">
      <div className="decoder-processing-icon" aria-hidden="true">
        🙁
      </div>
      <h2>We couldn't read that one</h2>
      <p>{message}</p>
      <ul className="decoder-error-tips">
        <li>Lay the page flat and use even, bright lighting</li>
        <li>Make sure the whole staff is visible in the frame</li>
        <li>Avoid glare, shadows, and blurry or angled photos</li>
      </ul>
      <button className="button" type="button" onClick={onTryAgain}>
        Try another file
      </button>
    </div>
  );
}
